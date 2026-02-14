import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import type { Settlement } from '@/types/database'

export function useSettlements() {
  const { user, settlements, setSettlements, addSettlement } = useStore()

  const loadSettlements = useCallback(async () => {
    if (!user?.household_id) return

    const { data, error } = await supabase
      .from('settlements')
      .select('*, payer:profiles!paid_by(*), receiver:profiles!paid_to(*)')
      .eq('household_id', user.household_id)
      .order('date', { ascending: false })

    if (!error && data) {
      setSettlements(data as Settlement[])
    }
  }, [user?.household_id, setSettlements])

  useEffect(() => {
    loadSettlements()
  }, [loadSettlements])

  async function createSettlement(amount: number, paidBy: string, paidTo: string) {
    if (!user?.household_id) return

    const settlement = {
      id: crypto.randomUUID(),
      amount,
      paid_by: paidBy,
      paid_to: paidTo,
      date: new Date().toISOString().split('T')[0],
      household_id: user.household_id,
    }

    addSettlement(settlement as Settlement)

    const { error } = await supabase.from('settlements').insert(settlement)
    if (error) {
      await loadSettlements()
    }
  }

  return { settlements, createSettlement, loadSettlements }
}
