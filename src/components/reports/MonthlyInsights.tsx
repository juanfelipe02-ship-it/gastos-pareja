import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { formatCurrency, cn } from '@/lib/utils'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import type { Expense, Category, Budget } from '@/types/database'

interface Props {
  expenses: Expense[]
  selectedMonth: Date
  budgets?: Budget[]
}

interface Insight {
  type: 'warning' | 'success' | 'info' | 'tip'
  icon: string
  title: string
  description: string
}

export function MonthlyInsights({ expenses, selectedMonth, budgets }: Props) {
  const { categories, currency, user, partner } = useStore()

  const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
  const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd')
  const prevStart = format(startOfMonth(subMonths(selectedMonth, 1)), 'yyyy-MM-dd')
  const prevEnd = format(endOfMonth(subMonths(selectedMonth, 1)), 'yyyy-MM-dd')

  const currentExpenses = useMemo(
    () => expenses.filter((e) => e.date >= start && e.date <= end),
    [expenses, start, end]
  )

  const prevExpenses = useMemo(
    () => expenses.filter((e) => e.date >= prevStart && e.date <= prevEnd),
    [expenses, prevStart, prevEnd]
  )

  const insights = useMemo(() => {
    const results: Insight[] = []
    const totalCurrent = currentExpenses.reduce((s, e) => s + e.amount, 0)
    const totalPrev = prevExpenses.reduce((s, e) => s + e.amount, 0)

    if (currentExpenses.length === 0) {
      return [{
        type: 'info' as const,
        icon: '📝',
        title: 'Sin datos este mes',
        description: 'Agrega gastos para ver análisis y recomendaciones.',
      }]
    }

    // 1. Month over month comparison
    if (totalPrev > 0) {
      const diff = totalCurrent - totalPrev
      const pctChange = Math.round((diff / totalPrev) * 100)

      if (pctChange > 20) {
        results.push({
          type: 'warning',
          icon: '📈',
          title: `Gastos +${pctChange}% vs mes anterior`,
          description: `Gastaron ${formatCurrency(totalCurrent, currency)} vs ${formatCurrency(totalPrev, currency)} el mes pasado. Revisen qué categorías aumentaron.`,
        })
      } else if (pctChange < -10) {
        results.push({
          type: 'success',
          icon: '📉',
          title: `Gastos ${pctChange}% vs mes anterior`,
          description: `¡Bien! Redujeron gastos de ${formatCurrency(totalPrev, currency)} a ${formatCurrency(totalCurrent, currency)}.`,
        })
      } else {
        results.push({
          type: 'info',
          icon: '➡️',
          title: 'Gastos estables',
          description: `Similar al mes pasado (${pctChange > 0 ? '+' : ''}${pctChange}%). Total: ${formatCurrency(totalCurrent, currency)}.`,
        })
      }
    }

    // 2. Category analysis
    const catTotals = new Map<string, { current: number; prev: number; cat: Category | undefined }>()
    for (const e of currentExpenses) {
      const cat = categories.find((c) => c.id === e.category_id)
      const key = e.category_id
      const existing = catTotals.get(key) || { current: 0, prev: 0, cat }
      existing.current += e.amount
      catTotals.set(key, existing)
    }
    for (const e of prevExpenses) {
      const cat = categories.find((c) => c.id === e.category_id)
      const key = e.category_id
      const existing = catTotals.get(key) || { current: 0, prev: 0, cat }
      existing.prev += e.amount
      catTotals.set(key, existing)
    }

    // Top spending category
    const sorted = Array.from(catTotals.values()).sort((a, b) => b.current - a.current)
    if (sorted.length > 0) {
      const top = sorted[0]
      const cat = top.cat
      if (cat) {
        const pct = Math.round((top.current / totalCurrent) * 100)
        results.push({
          type: pct > 40 ? 'warning' : 'info',
          icon: cat.icon,
          title: `${cat.name}: ${pct}% del total`,
          description: pct > 40
            ? `${cat.name} representa casi la mitad de sus gastos (${formatCurrency(top.current, currency)}). Consideren formas de optimizar.`
            : `Mayor gasto en ${cat.name}: ${formatCurrency(top.current, currency)}.`,
        })
      }
    }

    // Category that increased the most
    for (const item of sorted) {
      if (item.prev > 0 && item.current > item.prev * 1.5 && item.cat) {
        results.push({
          type: 'warning',
          icon: '🔺',
          title: `${item.cat.name} subió ${Math.round(((item.current - item.prev) / item.prev) * 100)}%`,
          description: `De ${formatCurrency(item.prev, currency)} a ${formatCurrency(item.current, currency)}. Revisen si fue gasto puntual o tendencia.`,
        })
        break
      }
    }

    // 3. Split balance analysis
    const myPaid = currentExpenses.filter((e) => e.paid_by === user?.id).reduce((s, e) => s + e.amount, 0)
    const partnerPaid = currentExpenses.filter((e) => e.paid_by === partner?.id).reduce((s, e) => s + e.amount, 0)

    if (myPaid > 0 && partnerPaid > 0) {
      const ratio = Math.round((myPaid / (myPaid + partnerPaid)) * 100)
      if (ratio > 70 || ratio < 30) {
        results.push({
          type: 'tip',
          icon: '⚖️',
          title: `Desbalance en pagos: ${ratio}/${100 - ratio}`,
          description: ratio > 70
            ? `Tú has pagado la mayoría (${formatCurrency(myPaid, currency)}). Consideren equilibrar o saldar cuentas.`
            : `${partner?.name || 'Tu pareja'} ha pagado la mayoría (${formatCurrency(partnerPaid, currency)}).`,
        })
      }
    }

    // 4. Practical recommendations
    const avgPerDay = totalCurrent / new Date(end).getDate()
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()
    const projected = avgPerDay * daysInMonth
    const today = new Date()
    const isCurrentMonth = selectedMonth.getMonth() === today.getMonth() && selectedMonth.getFullYear() === today.getFullYear()

    // 4b. Budget-aware insights
    const totalBudget = budgets && budgets.length > 0
      ? budgets.reduce((s, b) => s + b.amount, 0)
      : 0

    if (totalBudget > 0 && isCurrentMonth && today.getDate() < 25) {
      // Budget pacing
      const pctUsed = Math.round((totalCurrent / totalBudget) * 100)
      const expectedPct = Math.round((today.getDate() / daysInMonth) * 100)

      if (pctUsed > 100) {
        results.push({
          type: 'warning',
          icon: '🚨',
          title: `Presupuesto excedido: ${pctUsed}%`,
          description: `Gastaron ${formatCurrency(totalCurrent, currency)} de ${formatCurrency(totalBudget, currency)} presupuestado. Excedieron por ${formatCurrency(totalCurrent - totalBudget, currency)}.`,
        })
      } else if (pctUsed > expectedPct + 10) {
        results.push({
          type: 'warning',
          icon: '⚠️',
          title: `Ritmo alto: ${pctUsed}% del presupuesto`,
          description: `Al día ${today.getDate()} deberían estar en ~${expectedPct}% pero van en ${pctUsed}%. Moderen el gasto.`,
        })
      } else {
        results.push({
          type: 'success',
          icon: '💪',
          title: `Buen ritmo: ${pctUsed}% del presupuesto`,
          description: `Van bien. Al día ${today.getDate()} esperado ~${expectedPct}%, llevan ${pctUsed}%.`,
        })
      }

      // Projection vs budget
      if (projected > totalBudget) {
        const dailyReduction = Math.ceil((projected - totalBudget) / (daysInMonth - today.getDate()))
        results.push({
          type: 'warning',
          icon: '🔮',
          title: `Proyección: ${formatCurrency(projected, currency)}`,
          description: `Excederían el presupuesto de ${formatCurrency(totalBudget, currency)} por ${formatCurrency(projected - totalBudget, currency)}. Reduzcan ${formatCurrency(dailyReduction, currency)}/día para ajustarse.`,
        })
      } else {
        results.push({
          type: 'success',
          icon: '🔮',
          title: `Proyección: ${formatCurrency(projected, currency)}`,
          description: `Dentro del presupuesto de ${formatCurrency(totalBudget, currency)} con ${formatCurrency(totalBudget - projected, currency)} de margen.`,
        })
      }

      // Categories over budget
      if (budgets) {
        for (const budget of budgets) {
          const cat = categories.find((c) => c.id === budget.category_id)
          const actual = currentExpenses
            .filter((e) => e.category_id === budget.category_id)
            .reduce((s, e) => s + e.amount, 0)

          if (actual > budget.amount && cat) {
            results.push({
              type: 'warning',
              icon: cat.icon,
              title: `${cat.name}: excedido ${Math.round(((actual - budget.amount) / budget.amount) * 100)}%`,
              description: `Presupuesto: ${formatCurrency(budget.amount, currency)}, gastado: ${formatCurrency(actual, currency)}.`,
            })
          }
        }
      }
    } else if (isCurrentMonth && today.getDate() < 25 && totalBudget === 0) {
      results.push({
        type: 'info',
        icon: '🔮',
        title: `Proyección: ${formatCurrency(projected, currency)}`,
        description: `Al ritmo actual (${formatCurrency(avgPerDay, currency)}/día), terminarían el mes con ${formatCurrency(projected, currency)}.`,
      })
    }

    // 5. Spending on weekends vs weekdays
    const weekendExpenses = currentExpenses.filter((e) => {
      const day = new Date(e.date + 'T12:00:00').getDay()
      return day === 0 || day === 6
    })
    const weekendTotal = weekendExpenses.reduce((s, e) => s + e.amount, 0)
    const weekendPct = Math.round((weekendTotal / totalCurrent) * 100)
    if (weekendPct > 50) {
      results.push({
        type: 'tip',
        icon: '🗓️',
        title: `${weekendPct}% del gasto es los fines de semana`,
        description: `Gastan ${formatCurrency(weekendTotal, currency)} en fines de semana. Planeen actividades más económicas.`,
      })
    }

    // 6. Number of transactions
    if (currentExpenses.length > 50) {
      results.push({
        type: 'tip',
        icon: '🔢',
        title: `${currentExpenses.length} transacciones este mes`,
        description: 'Muchas compras pequeñas pueden sumar. Consideren hacer compras más consolidadas.',
      })
    }

    return results
  }, [currentExpenses, prevExpenses, categories, currency, user?.id, partner])

  const typeStyles = {
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    tip: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
        🤖 Análisis automático
      </h3>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={cn(
            'p-3.5 rounded-2xl border animate-fade-in',
            typeStyles[insight.type]
          )}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <span>{insight.icon}</span>
            {insight.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
            {insight.description}
          </p>
        </div>
      ))}
    </div>
  )
}
