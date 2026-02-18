import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { format, startOfMonth } from 'date-fns'
import type { Budget } from '@/types/database'

export function useBudgets() {
  const { user, budgets, setBudgets, upsertBudget, removeBudget } = useStore()

  const loadBudgets = useCallback(async () => {
    if (!user?.household_id) return

    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('household_id', user.household_id)
      .order('month', { ascending: false })

    if (!error && data) {
      setBudgets(data as Budget[])
    }
  }, [user?.household_id, setBudgets])

  useEffect(() => {
    loadBudgets()
  }, [loadBudgets])

  function getBudgetsForMonth(month: Date): Budget[] {
    const monthStr = format(startOfMonth(month), 'yyyy-MM-dd')
    return budgets.filter((b) => b.month === monthStr)
  }

  function getTotalBudget(month: Date): number {
    return getBudgetsForMonth(month).reduce((sum, b) => sum + b.amount, 0)
  }

  async function setBudget(categoryId: string, month: Date, amount: number) {
    if (!user?.household_id) return

    const monthStr = format(startOfMonth(month), 'yyyy-MM-dd')

    const tempBudget: Budget = {
      id: crypto.randomUUID(),
      category_id: categoryId,
      household_id: user.household_id,
      month: monthStr,
      amount,
      created_at: new Date().toISOString(),
    }
    upsertBudget(tempBudget)

    try {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          {
            category_id: categoryId,
            household_id: user.household_id,
            month: monthStr,
            amount,
          },
          { onConflict: 'category_id,household_id,month' }
        )
        .select()
        .single()

      if (error) throw error
      if (data) upsertBudget(data as Budget)
    } catch {
      await loadBudgets()
    }
  }

  async function deleteBudget(id: string) {
    removeBudget(id)
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
    } catch {
      await loadBudgets()
    }
  }

  async function copyBudgets(fromMonth: Date, toMonth: Date) {
    const sourceBudgets = getBudgetsForMonth(fromMonth)
    for (const b of sourceBudgets) {
      await setBudget(b.category_id, toMonth, b.amount)
    }
  }

  return {
    budgets,
    getBudgetsForMonth,
    getTotalBudget,
    setBudget,
    deleteBudget,
    copyBudgets,
    loadBudgets,
  }
}
