import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { useBudgets } from '@/hooks/useBudgets'
import { formatCurrency, formatMonthYear, cn } from '@/lib/utils'
import { subMonths } from 'date-fns'

interface Props {
  month: Date
  onClose: () => void
}

export function BudgetModal({ month, onClose }: Props) {
  const { categories, currency } = useStore()
  const { getBudgetsForMonth, setBudget, copyBudgets, getAnnualBudgetsForYear, setAnnualBudgetAmount } = useBudgets()

  const monthBudgets = getBudgetsForMonth(month)
  const prevMonthBudgets = getBudgetsForMonth(subMonths(month, 1))
  const year = month.getFullYear()
  const yearBudgets = getAnnualBudgetsForYear(year)

  const [tab, setTab] = useState<'monthly' | 'annual'>('monthly')
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [annualAmounts, setAnnualAmounts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const cat of categories) {
      const existing = monthBudgets.find((b) => b.category_id === cat.id)
      initial[cat.id] = existing ? String(existing.amount) : ''
    }
    setAmounts(initial)

    const initialAnnual: Record<string, string> = {}
    for (const cat of categories) {
      const existing = yearBudgets.find((b) => b.category_id === cat.id)
      initialAnnual[cat.id] = existing ? String(existing.amount) : ''
    }
    setAnnualAmounts(initialAnnual)
  }, [])

  const total = Object.values(amounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
  const annualTotal = Object.values(annualAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)

  async function handleSave() {
    setSaving(true)
    try {
      if (tab === 'monthly') {
        for (const cat of categories) {
          const val = parseFloat(amounts[cat.id] || '0')
          if (val > 0) await setBudget(cat.id, month, val)
        }
      } else {
        for (const cat of categories) {
          const val = parseFloat(annualAmounts[cat.id] || '0')
          if (val > 0) await setAnnualBudgetAmount(cat.id, year, val)
        }
      }
      onClose()
    } catch {
      setSaving(false)
    }
  }

  async function handleCopyPrevious() {
    if (prevMonthBudgets.length === 0) return
    const copied: Record<string, string> = { ...amounts }
    for (const b of prevMonthBudgets) {
      copied[b.category_id] = String(b.amount)
    }
    setAmounts(copied)
  }

  const currentAmounts = tab === 'monthly' ? amounts : annualAmounts
  const setCurrentAmounts = tab === 'monthly' ? setAmounts : setAnnualAmounts
  const currentTotal = tab === 'monthly' ? total : annualTotal

  return (
    <div className="bottom-sheet" onClick={onClose}>
      <div className="bottom-sheet-overlay" />
      <div
        className="bottom-sheet-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-200 mb-1">
            Presupuesto
          </h2>

          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-4">
            <button
              onClick={() => setTab('monthly')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                tab === 'monthly' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
              )}
            >
              Mensual
            </button>
            <button
              onClick={() => setTab('annual')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                tab === 'annual' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
              )}
            >
              Anual {year}
            </button>
          </div>

          <p className="text-xs text-center text-gray-400 mb-3">
            {tab === 'monthly' ? formatMonthYear(month) : `Presupuesto anualizado ${year} (÷12 por mes)`}
          </p>

          {tab === 'monthly' && prevMonthBudgets.length > 0 && (
            <button
              onClick={handleCopyPrevious}
              className="w-full mb-4 py-2.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600
                         text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
            >
              📋 Copiar del mes anterior
            </button>
          )}

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <span className="text-lg">{cat.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                    {cat.name}
                  </p>
                  {tab === 'annual' && currentAmounts[cat.id] && (
                    <p className="text-[10px] text-gray-400">
                      ~{formatCurrency(Math.round(parseFloat(currentAmounts[cat.id]) / 12), currency)}/mes
                    </p>
                  )}
                </div>
                <div className="w-32 flex-shrink-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={tab === 'annual' ? '$0 /año' : '$0'}
                    value={currentAmounts[cat.id] || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '')
                      setCurrentAmounts((prev) => ({ ...prev, [cat.id]: val }))
                    }}
                    className="w-full text-right text-sm font-medium px-3 py-2 rounded-xl
                               bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                               border border-gray-200 dark:border-gray-600
                               focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {tab === 'monthly' ? 'Total mensual' : 'Total anual'}
            </span>
            <span className="text-lg font-bold text-emerald-600">
              {formatCurrency(currentTotal, currency)}
            </span>
          </div>
          {tab === 'annual' && annualTotal > 0 && (
            <p className="text-xs text-gray-400 text-right">
              ~{formatCurrency(Math.round(annualTotal / 12), currency)}/mes
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || currentTotal === 0}
              className={cn(
                'flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-sm',
                (saving || currentTotal === 0) && 'opacity-40 cursor-not-allowed'
              )}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
