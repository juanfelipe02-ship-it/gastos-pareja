import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { addToQueue } from '@/lib/offline-queue'
import type { Expense, SplitType } from '@/types/database'

export function useExpenses() {
  const { user, expenses, setExpenses, addExpense, updateExpense, removeExpense, onboardingDone, setOnboardingDone } = useStore()

  const loadExpenses = useCallback(async () => {
    if (!user?.household_id) return

    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:categories(*), payer:profiles!paid_by(*)')
      .eq('household_id', user.household_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setExpenses(data as Expense[])
    }
  }, [user?.household_id, setExpenses])

  useEffect(() => {
    loadExpenses()

    if (!user?.household_id) return

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `household_id=eq.${user.household_id}`,
        },
        () => {
          loadExpenses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.household_id, loadExpenses])

  async function createExpense(data: {
    amount: number
    description?: string
    category_id: string
    paid_by: string
    split_type: SplitType
    split_percentage?: number
    date: string
    receipt_url?: string
  }) {
    if (!user?.household_id) return

    const id = crypto.randomUUID()
    const expense = {
      id,
      amount: data.amount,
      category_id: data.category_id,
      paid_by: data.paid_by,
      split_type: data.split_type,
      split_percentage: data.split_percentage ?? 50,
      date: data.date,
      description: data.description || null,
      receipt_url: data.receipt_url || null,
      created_by: user.id,
      household_id: user.household_id,
    }

    // For the DB insert, omit receipt_url if null (column may not exist yet)
    const { receipt_url, ...dbExpense } = expense
    const insertData = receipt_url ? expense : dbExpense

    // Optimistic update
    addExpense(expense as unknown as Expense)

    try {
      const { error } = await supabase.from('expenses').insert(insertData)
      if (error) {
        removeExpense(id)
        addToQueue({ table: 'expenses', type: 'insert', data: insertData })
        throw error
      }
    } catch {
      // Already added to queue
    }

    await loadExpenses()

    if (!onboardingDone) {
      setOnboardingDone(true)
    }
  }

  async function editExpense(id: string, data: Partial<Expense>) {
    updateExpense(id, data)

    // Strip joined/read-only fields before sending to Supabase
    const { category, payer, created_at, id: _id, ...updateData } = data as Record<string, unknown>

    try {
      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', id)
      if (error) throw error
    } catch {
      await loadExpenses()
    }
  }

  async function deleteExpense(id: string) {
    removeExpense(id)

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    } catch {
      await loadExpenses()
    }
  }

  return { expenses, createExpense, editExpense, deleteExpense, loadExpenses }
}
