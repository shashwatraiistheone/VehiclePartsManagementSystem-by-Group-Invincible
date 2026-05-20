import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CustomerHistory } from '../../services/customerApi'
import { EmptyState } from './shared'
import {
  buildMonthlySpending,
  formatSpendingAxis,
  formatSpendingTooltip,
  hasSpendingData,
  spendingMonthOverMonthChange,
} from './spendingTrend'

type Props = {
  history: CustomerHistory
}

function SpendingTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="text-blue-600">{formatSpendingTooltip(payload[0].value)}</p>
    </div>
  )
}

export function SpendingTrendCard({ history }: Props) {
  const chartData = useMemo(() => buildMonthlySpending(history.purchases, 6), [history.purchases])
  const showChart = hasSpendingData(chartData)
  const momChange = spendingMonthOverMonthChange(chartData)
  const periodTotal = useMemo(() => chartData.reduce((sum, p) => sum + p.total, 0), [chartData])
  const peakMonth = useMemo(() => {
    if (!showChart) return null
    return chartData.reduce((best, p) => (p.total > best.total ? p : best), chartData[0])
  }, [chartData, showChart])

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Your Spending Trend</h2>
          <p className="mt-0.5 text-sm text-slate-500">Track your monthly spending activity</p>
        </div>
        {showChart ? (
          <div className="mt-2 flex flex-wrap gap-4 text-xs sm:mt-0 sm:justify-end">
            <div className="text-right">
              <p className="text-slate-500">Last 6 months</p>
              <p className="font-semibold text-slate-900">
                Rs. {periodTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            {momChange != null ? (
              <div className="text-right">
                <p className="text-slate-500">vs last month</p>
                <p
                  className={[
                    'font-semibold',
                    momChange >= 0 ? 'text-emerald-600' : 'text-red-600',
                  ].join(' ')}
                >
                  {momChange >= 0 ? '+' : ''}
                  {momChange}%
                </p>
              </div>
            ) : null}
            {peakMonth && peakMonth.total > 0 ? (
              <div className="text-right">
                <p className="text-slate-500">Peak month</p>
                <p className="font-semibold text-slate-900">
                  {peakMonth.label} · {formatSpendingTooltip(peakMonth.total)}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 h-56 w-full sm:h-64">
        {showChart ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="customerSpendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={formatSpendingAxis}
              />
              <Tooltip content={<SpendingTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#customerSpendGrad)"
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <EmptyState
              title="No spending data available yet"
              description="Your monthly spending chart will appear after your first purchase."
            />
          </div>
        )}
      </div>
    </section>
  )
}
