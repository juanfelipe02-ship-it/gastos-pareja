import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { useExpenses } from '@/hooks/useExpenses'
import { MonthlyInsights } from '@/components/reports/MonthlyInsights'
import { formatCurrency, formatMonthYear } from '@/lib/utils'
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

export function Reports() {
  const { categories, currency, user, partner } = useStore()
  const { expenses } = useExpenses()
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
  const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd')

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date >= start && e.date <= end),
    [expenses, start, end]
  )

  // Category breakdown
  const categoryData = useMemo(() => {
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

  // Monthly comparison (last 6 months)
  const monthlyComparison = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      const s = format(startOfMonth(d), 'yyyy-MM-dd')
      const e = format(endOfMonth(d), 'yyyy-MM-dd')
      const monthExpenses = expenses.filter((ex) => ex.date >= s && ex.date <= e)
      const total = monthExpenses.reduce((sum, ex) => sum + ex.amount, 0)
      months.push({
        month: format(d, 'MMM', { locale: es }),
        total,
        mine: monthExpenses
          .filter((ex) => ex.paid_by === user?.id)
          .reduce((sum, ex) => sum + ex.amount, 0),
        partner: monthExpenses
          .filter((ex) => ex.paid_by === partner?.id)
          .reduce((sum, ex) => sum + ex.amount, 0),
      })
    }
    return months
  }, [expenses, user?.id, partner?.id])

  const totalMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  function exportCSV() {
    const header = 'Fecha,Descripción,Categoría,Monto,Pagó,División\n'
    const rows = monthExpenses
      .map((e) => {
        const cat = categories.find((c) => c.id === e.category_id)
        const payer = e.paid_by === user?.id ? 'Yo' : partner?.name || 'Pareja'
        return `${e.date},"${e.description || cat?.name || ''}",${cat?.name || ''},${e.amount},${payer},${e.split_type}`
      })
      .join('\n')

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gastos-${format(selectedMonth, 'yyyy-MM')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setSelectedMonth((m) => subMonths(m, 1))}
          className="p-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          {formatMonthYear(selectedMonth)}
        </h1>
        <button
          onClick={() => setSelectedMonth((m) => subMonths(m, -1))}
          className="p-2 text-gray-400 hover:text-gray-600 text-lg"
        >
          →
        </button>
      </div>

      {/* Total */}
      <div className="card p-4 mb-4 text-center">
        <p className="text-xs text-gray-400 mb-1">Total del mes</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
          {formatCurrency(totalMonth, currency)}
        </p>
      </div>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Por categoría
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-300 text-xs">
                      {item.icon} {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-gray-900 dark:text-white text-xs tabular-nums">
                      {formatCurrency(item.value, currency)}
                    </span>
                    <span className="text-gray-400 text-[10px] ml-1">
                      ({Math.round((item.value / totalMonth) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly comparison */}
      <div className="card p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Últimos 6 meses
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparison} barGap={2}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, currency)}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="mine" name="Yo" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="partner"
                name={partner?.name || 'Pareja'}
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-500">Yo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-gray-500">{partner?.name || 'Pareja'}</span>
          </div>
        </div>
      </div>

      {/* Monthly Insights */}
      <div className="card p-4 mb-4">
        <MonthlyInsights expenses={expenses} selectedMonth={selectedMonth} />
      </div>

      {/* Export */}
      <button
        onClick={exportCSV}
        className="w-full btn-secondary text-sm mb-6"
        disabled={monthExpenses.length === 0}
      >
        📥 Exportar CSV
      </button>
    </div>
  )
}
