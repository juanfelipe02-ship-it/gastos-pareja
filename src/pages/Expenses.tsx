import { useState, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { useExpenses } from '@/hooks/useExpenses'
import { ExpenseCard } from '@/components/expenses/ExpenseCard'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'
import { formatMonthYear, formatCurrency } from '@/lib/utils'
import { startOfMonth, endOfMonth, addMonths, subMonths, format } from 'date-fns'
import type { Expense } from '@/types/database'

export function Expenses() {
  const { user, partner, categories, currency } = useStore()
  const { expenses, deleteExpense } = useExpenses()

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterPaidBy, setFilterPaidBy] = useState<string>('')
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
  const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.date < start || e.date > end) return false
      if (filterCategory && e.category_id !== filterCategory) return false
      if (filterPaidBy && e.paid_by !== filterPaidBy) return false
      return true
    })
  }, [expenses, start, end, filterCategory, filterPaidBy])

  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  )

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar este gasto?')) {
      deleteExpense(id)
    }
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          {formatMonthYear(currentMonth)}
        </h1>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          →
        </button>
      </div>

      {/* Total */}
      <div className="card p-3 mb-4 text-center">
        <p className="text-xs text-gray-400">Total del mes</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
          {formatCurrency(totalFiltered, currency)}
        </p>
        <p className="text-xs text-gray-400">{filteredExpenses.length} gastos</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl px-3 py-2 border-0 appearance-none"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterPaidBy}
          onChange={(e) => setFilterPaidBy(e.target.value)}
          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl px-3 py-2 border-0 appearance-none"
        >
          <option value="">Todos</option>
          <option value={user?.id || ''}>Yo</option>
          {partner && <option value={partner.id}>{partner.name}</option>}
        </select>
      </div>

      {/* Expense list */}
      {filteredExpenses.length > 0 ? (
        <div>
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400 text-sm">No hay gastos para este período</p>
        </div>
      )}

      {editingExpense && (
        <ExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  )
}
