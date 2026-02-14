import { useMemo } from 'react'
import { differenceInDays, differenceInHours } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Expense } from '@/types/database'

interface Props {
  expenses: Expense[]
  onAddExpense: () => void
}

export function ExpenseReminder({ expenses, onAddExpense }: Props) {
  const reminder = useMemo(() => {
    if (expenses.length === 0) {
      return {
        show: true,
        icon: '👋',
        title: '¡Empieza a registrar!',
        description: 'Agrega tu primer gasto para llevar el control.',
        urgency: 'info' as const,
      }
    }

    const latest = expenses[0]
    if (!latest) return null

    const lastDate = new Date(latest.created_at || latest.date + 'T12:00:00')
    const hoursSince = differenceInHours(new Date(), lastDate)
    const daysSince = differenceInDays(new Date(), lastDate)

    if (daysSince >= 3) {
      return {
        show: true,
        icon: '⏰',
        title: `${daysSince} días sin registrar gastos`,
        description: 'No olvides anotar tus gastos para mantener las cuentas al día.',
        urgency: 'warning' as const,
      }
    }

    if (daysSince >= 1) {
      return {
        show: true,
        icon: '📝',
        title: '¿Gastos de hoy?',
        description: 'Registra los gastos del día para no olvidarlos.',
        urgency: 'gentle' as const,
      }
    }

    // Check if today is end of month (last 2 days)
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    if (today.getDate() >= daysInMonth - 1) {
      return {
        show: true,
        icon: '📊',
        title: 'Fin de mes',
        description: 'Revisa tus reportes mensuales y salda cuentas antes de cerrar el mes.',
        urgency: 'info' as const,
      }
    }

    return null
  }, [expenses])

  if (!reminder?.show) return null

  const urgencyStyles = {
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
    gentle: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    info: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
  }

  return (
    <div
      className={cn(
        'p-3.5 rounded-2xl border mb-4 animate-fade-in',
        urgencyStyles[reminder.urgency]
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{reminder.icon}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
            {reminder.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            {reminder.description}
          </p>
        </div>
        <button
          onClick={onAddExpense}
          className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl
                     hover:bg-emerald-600 active:scale-95 transition-all flex-shrink-0"
        >
          + Agregar
        </button>
      </div>
    </div>
  )
}
