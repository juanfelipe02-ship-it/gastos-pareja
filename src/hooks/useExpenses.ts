import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { addToQueue } from '@/lib/offline-queue'
import type { Expense, SplitType } from '@/types/database'

export function useExpenses() {
  const { user, expenses, setExpenses, addExpense, updateExpense, removeExpense } = useStore()

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

    const expense = {
      ...data,
      id: crypto.randomUUID(),
      created_by: user.id,
      household_id: user.household_id,
      split_percentage: data.split_percentage ?? 50,
      description: data.description || null,
      receipt_url: data.receipt_url || null,
    }

    // Optimistic update
    addExpense(expense as Expense)

    try {
      const { error } = await supabase.from('expenses').insert(expense)
      if (error) {
        removeExpense(expense.id)
        addToQueue({ table: 'expenses', type: 'insert', data: expense })
        throw error
      }
    } catch {
      // Already added to queue
    }

    await loadExpenses()
  }

  async function editExpense(id: string, data: Partial<Expense>) {
    updateExpense(id, data)

    try {
      const { error } = await supabase
        .from('expenses')
        .update(data)
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
