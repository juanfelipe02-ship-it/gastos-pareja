import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useStore } from '@/store/useStore'
import { useExpenses } from '@/hooks/useExpenses'
import { useSettlements } from '@/hooks/useSettlements'
import { formatCurrency, calculateBalance, getMonthRange, formatMonthYear, cn } from '@/lib/utils'

export function Dashboard() {
  const { user, partner, categories, currency } = useStore()
  const { expenses } = useExpenses()
  const { settlements, createSettlement } = useSettlements()
  const [showSettle, setShowSettle] = useState(false)
  const [settleAmount, setSettleAmount] = useState('')
  const [settleError, setSettleError] = useState('')
  const [settling, setSettling] = useState(false)

  const now = new Date()
  const { start, end } = getMonthRange(now)

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date >= start && e.date <= end),
    [expenses, start, end]
  )

  const balance = useMemo(
    () => calculateBalance(expenses, settlements, user?.id || ''),
    [expenses, settlements, user?.id]
  )

  const totalMonth = useMemo(
    () => monthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses]
  )

  const myTotal = useMemo(
    () =>
      monthExpenses
        .filter((e) => e.paid_by === user?.id)
        .reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses, user?.id]
  )

  const partnerTotal = useMemo(
    () =>
      monthExpenses
        .filter((e) => e.paid_by === partner?.id)
        .reduce((sum, e) => sum + e.amount, 0),
    [monthExpenses, partner?.id]
  )

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of monthExpenses) {
      const cat = categories.find((c) => c.id === e.category_id)
      const name = cat?.name || 'Otros'
      map.set(name, (map.get(name) || 0) + e.amount)
    }
    return Array.from(map.entries())
      .map(([name, value]) => {
        const cat = categories.find((c) => c.name === name)
        return { name, value, color: cat?.color || '#6b7280', icon: cat?.icon || '📦' }
      })
      .sort((a, b) => b.value - a.value)
  }, [monthExpenses, categories])

  async function handleSettle() {
    const amount = parseFloat(settleAmount)
    if (!amount || !user) return
    setSettleError('')
    setSettling(true)

    try {
      if (partner) {
        // With partner linked
        if (balance > 0) {
          await createSettlement(amount, partner.id, user.id)
        } else {
          await createSettlement(amount, user.id, partner.id)
        }
      } else {
        // No partner linked - settle with self as both parties (solo mode)
        await createSettlement(amount, user.id, user.id)
      }
      setShowSettle(false)
      setSettleAmount('')
    } catch (err: any) {
      setSettleError(err?.message || 'Error al saldar')
    } finally {
      setSettling(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-gray-400">Hola, {user?.name || 'Usuario'} 👋</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatMonthYear(now)}
        </h1>
      </div>

      {/* Balance card */}
      <div
        className={cn(
          'card p-5 mb-4',
          balance > 0
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10'
            : balance < 0
            ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10'
            : ''
        )}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Balance</p>
        <p
          className={cn(
            'text-3xl font-bold tabular-nums',
            balance > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : balance < 0
              ? 'text-red-500'
              : 'text-gray-600 dark:text-gray-300'
          )}
        >
          {balance > 0 ? '+' : ''}
          {formatCurrency(Math.abs(balance), currency)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {balance > 0
            ? `${partner?.name || 'Pareja'} te debe`
            : balance < 0
            ? `Le debes a ${partner?.name || 'Pareja'}`
            : 'Están a mano ✌️'}
        </p>

        {balance !== 0 && (
          <button
            onClick={() => setShowSettle(true)}
            className="mt-3 btn-primary text-sm py-2 px-4"
          >
            Saldar cuentas
          </button>
        )}
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Total</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
            {formatCurrency(totalMonth, currency)}
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Yo</p>
          <p className="text-sm font-bold text-emerald-600 tabular-nums">
            {formatCurrency(myTotal, currency)}
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">{partner?.name || 'Pareja'}</p>
          <p className="text-sm font-bold text-orange-500 tabular-nums">
            {formatCurrency(partnerTotal, currency)}
          </p>
        </div>
      </div>

      {/* Category chart */}
      {chartData.length > 0 ? (
        <div className="card p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Gastos por categoría
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {chartData.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-300">
                      {item.icon} {item.name}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(item.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center mb-6">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No hay gastos este mes.
            <br />
            Toca el botón <span className="text-emerald-500 font-bold">+</span> para agregar uno.
          </p>
        </div>
      )}

      {/* Recent expenses */}
      {monthExpenses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
            Últimos gastos
          </h3>
          {monthExpenses.slice(0, 5).map((expense) => {
            const cat = categories.find((c) => c.id === expense.category_id)
            return (
              <div key={expense.id} className="card p-3 mb-2 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${cat?.color}20` }}
                >
                  {cat?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                    {expense.description || cat?.name}
                  </p>
                  <p className="text-xs text-gray-400">{expense.split_type}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(expense.amount, currency)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Settle modal */}
      {showSettle && (
        <div className="bottom-sheet" onClick={() => setShowSettle(false)}>
          <div className="bottom-sheet-overlay" />
          <div className="bottom-sheet-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-1 pb-4">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Saldar cuentas
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              {balance > 0
                ? `${partner?.name || 'Pareja'} te debe`
                : `Le debes a ${partner?.name || 'Pareja'}`}
            </p>
            <p className={cn(
              'text-2xl font-bold mb-4 tabular-nums',
              balance > 0 ? 'text-emerald-600' : 'text-red-500'
            )}>
              {formatCurrency(Math.abs(balance), currency)}
            </p>

            {/* Quick settle: full amount */}
            <button
              onClick={() => setSettleAmount(Math.abs(balance).toString())}
              className="w-full btn-secondary text-sm mb-3 flex items-center justify-center gap-2"
            >
              Saldar todo ({formatCurrency(Math.abs(balance), currency)})
            </button>

            {/* Custom amount */}
            <p className="text-xs text-gray-400 mb-2">O ingresa un monto parcial:</p>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Monto"
              value={settleAmount}
              onChange={(e) => setSettleAmount(e.target.value)}
              className="input mb-4 text-lg text-center"
            />
            {settleError && (
              <p className="text-red-500 text-sm text-center mb-3 animate-fade-in">{settleError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowSettle(false); setSettleAmount(''); setSettleError('') }}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleSettle}
                disabled={!settleAmount || parseFloat(settleAmount) <= 0 || settling}
                className={cn(
                  'flex-1 btn-primary',
                  (!settleAmount || parseFloat(settleAmount) <= 0 || settling) && 'opacity-40'
                )}
              >
                {settling ? 'Guardando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
