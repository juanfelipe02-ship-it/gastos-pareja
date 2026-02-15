import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import type { Profile } from '@/types/database'

export function useAuth() {
  const { user, setUser, partner, setPartner, setCategories, onboardingDone, setOnboardingDone } = useStore()
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSession(session.user.id, session.user.email || '', session.user.user_metadata?.name)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSession(session.user.id, session.user.email || '', session.user.user_metadata?.name)
      } else {
        setUser(null)
        setPartner(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(userId: string, email: string, name?: string) {
    // Prevent concurrent calls
    if (loadingRef.current) return
    loadingRef.current = true

    try {
      // Try to load existing profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !profile) {
        // Profile might not be readable yet, or trigger hasn't finished
        // Try creating (will be ignored if trigger already created it)
        console.log('Profile not found, attempting to create...')
        await createProfileIfNeeded(userId, email, name || email.split('@')[0])
        return
      }

      setUser(profile as Profile)

      // Load partner if linked
      if (profile.partner_id) {
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.partner_id)
          .single()

        if (partnerProfile) {
          setPartner(partnerProfile as Profile)
        }
      }

      // Load categories
      if (profile.household_id) {
        const { data: categories } = await supabase
          .from('categories')
          .select('*')
          .eq('household_id', profile.household_id)
          .order('created_at')

        if (categories && categories.length > 0) {
          setCategories(categories)
        }

        // Auto-complete onboarding for existing users with expenses
        if (!onboardingDone) {
          if (profile.partner_id) {
            setOnboardingDone(true)
          } else {
            const { count } = await supabase
              .from('expenses')
              .select('*', { count: 'exact', head: true })
              .eq('household_id', profile.household_id)

            if (count && count > 0) {
              setOnboardingDone(true)
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in handleSession:', err)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  async function createProfileIfNeeded(userId: string, email: string, name: string) {
    const householdId = crypto.randomUUID()
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Try to insert - ignore duplicate key error (23505) if trigger already created it
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      name,
      email,
      household_id: householdId,
      invite_code: inviteCode,
    })

    if (profileError && profileError.code !== '23505') {
      console.error('Error creating profile:', profileError)
    }

    // If we created it successfully, also add default categories
    if (!profileError) {
      const defaultCats = [
        { name: 'Mercado', icon: '🛒', color: '#10b981' },
        { name: 'Restaurantes', icon: '🍽️', color: '#f59e0b' },
        { name: 'Hogar', icon: '🏠', color: '#3b82f6' },
        { name: 'Transporte', icon: '🚗', color: '#8b5cf6' },
        { name: 'Salud', icon: '💊', color: '#ef4444' },
        { name: 'Entretenimiento', icon: '🎬', color: '#ec4899' },
        { name: 'Ropa', icon: '👕', color: '#06b6d4' },
        { name: 'Otros', icon: '📦', color: '#6b7280' },
      ]
      await supabase.from('categories').insert(
        defaultCats.map((c) => ({ ...c, household_id: householdId }))
      )
    }

    // Wait a beat then retry loading the profile (now it should be readable)
    await new Promise((r) => setTimeout(r, 500))

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) {
      setUser(profile as Profile)

      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('household_id', profile.household_id)
        .order('created_at')

      if (categories) {
        setCategories(categories)
      }
    }

    setLoading(false)
  }

  async function signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    if (!data.user) throw new Error('No user returned')
    // onAuthStateChange will handle loading the profile
    return data
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setPartner(null)
    setOnboardingDone(false)
    localStorage.removeItem('gastos-pareja-storage')
  }

  async function joinPartner(inviteCode: string) {
    if (!user) throw new Error('Must be logged in')

    // Use server-side function to bypass RLS
    const { data, error } = await supabase.rpc('link_partner', {
      invite_code_input: inviteCode.toUpperCase(),
    })

    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)

    // Reload profile with new household
    loadingRef.current = false
    await handleSession(user.id, user.email || '', user.name)
  }

  return { user, partner, loading, signUp, signIn, signOut, joinPartner }
}
