import { useState, useRef } from 'react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import type { Expense } from '@/types/database'

interface Props {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function ExpenseCard({ expense, onEdit, onDelete }: Props) {
  const { user, currency } = useStore()
  const [swipeX, setSwipeX] = useState(0)
  const startX = useRef(0)
  const isSwiping = useRef(false)

  const category = expense.category
  const isMyExpense = expense.paid_by === user?.id

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    isSwiping.current = true
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping.current) return
    const diff = e.touches[0].clientX - startX.current
    setSwipeX(Math.max(-120, Math.min(0, diff)))
  }

  function handleTouchEnd() {
    isSwiping.current = false
    if (swipeX < -60) {
      setSwipeX(-120)
    } else {
      setSwipeX(0)
    }
  }

  function getSplitLabel(type: string): string {
    switch (type) {
      case '50/50': return '50/50'
      case 'solo_yo': return 'Solo mío'
      case 'solo_pareja': return 'Solo pareja'
      case 'custom': return `${expense.split_percentage}/${100 - expense.split_percentage}`
      default: return type
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl mb-2">
      {/* Swipe actions */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2">
        <button
          onClick={() => onEdit(expense)}
          className="bg-blue-500 text-white px-4 py-6 rounded-xl text-sm font-medium"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="bg-red-500 text-white px-4 py-6 rounded-xl text-sm font-medium"
        >
          Borrar
        </button>
      </div>

      {/* Card */}
      <div
        className="card p-3.5 flex items-center gap-3 relative bg-white dark:bg-gray-800 transition-transform"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Category icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${category?.color}20` }}
        >
          {category?.icon || '📦'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {expense.description || category?.name || 'Gasto'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(expense.date)} · {getSplitLabel(expense.split_type)} ·{' '}
            <span className={isMyExpense ? 'text-emerald-500' : 'text-orange-500'}>
              {isMyExpense ? 'Yo pagué' : 'Pagó pareja'}
            </span>
          </p>
        </div>

        {/* Receipt indicator */}
        {expense.receipt_url && (
          <a
            href={expense.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-lg flex-shrink-0"
            title="Ver recibo"
          >
            🧾
          </a>
        )}

        {/* Amount */}
        <p className="font-semibold text-sm text-gray-900 dark:text-white tabular-nums">
          {formatCurrency(expense.amount, currency)}
        </p>
      </div>
    </div>
  )
}
