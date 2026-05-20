import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BarChart3,
  FileBarChart,
  LineChart,
  PieChart as PieChartIcon,
  ShoppingCart,
  TrendingUp,
  Wallet,
  Percent,
  Sparkles,
  FileDown,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Props = {
  onBack?: () => void
}

const SUMMARY = {
  totalSales: 44_346.73,
  totalPurchases: 3_734_087.43,
  netProfit: -3_289_573.39,
  profitMargin: -494.9,
} as const

const DAILY_PERFORMANCE = [
  { day: 'Mon', sales: 4200 },
  { day: 'Tue', sales: 6800 },
  { day: 'Wed', sales: 5100 },
  { day: 'Thu', sales: 9200 },
  { day: 'Fri', sales: 7400 },
  { day: 'Sat', sales: 5800 },
  { day: 'Sun', sales: 4846 },
]

const MONTHLY_TRENDS = [
  { month: 'Jan', sales: 12400, purchases: 298000 },
  { month: 'Feb', sales: 18200, purchases: 412000 },
  { month: 'Mar', sales: 15600, purchases: 385000 },
  { month: 'Apr', sales: 22100, purchases: 520000 },
  { month: 'May', sales: 19800, purchases: 478000 },
  { month: 'Jun', sales: 24300, purchases: 610000 },
]

const PROFIT_DISTRIBUTION = [
  { name: 'Revenue', value: 44346.73, color: '#22c55e' },
  { name: 'Expenses', value: 3734087.43, color: '#f43f5e' },
]

function formatRs(amount: number, opts?: { percent?: boolean }) {
  if (opts?.percent) {
    const sign = amount < 0 ? '-' : ''
    return `${sign}${Math.abs(amount).toFixed(1)}%`
  }
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return amount < 0 ? `-Rs. ${formatted}` : `Rs. ${formatted}`
}

function FinancialTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatRs(entry.value)}
        </p>
      ))}
    </div>
  )
}

type SummaryCardProps = {
  title: string
  amount: string
  subtitle: string
  icon: ReactNode
  iconBg: string
  delay: number
  visible: boolean
}

function SummaryCard({ title, amount, subtitle, icon, iconBg, delay, visible }: SummaryCardProps) {
  return (
    <article
      className={[
        'group flex flex-col items-center rounded-2xl border border-slate-200/80 bg-white px-5 py-7 text-center shadow-sm',
        'transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-blue-200/60 hover:shadow-xl',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{amount}</p>
      <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
    </article>
  )
}

type ChartCardProps = {
  title: string
  icon: ReactNode
  children: ReactNode
  className?: string
}

function ChartCard({ title, icon, children, className = '' }: ChartCardProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:p-6 ${className}`}
    >
      <header className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          {icon}
        </div>
        <h2 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h2>
      </header>
      {children}
    </section>
  )
}

export function FinancialReportsPage({ onBack }: Props) {
  const [mounted, setMounted] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  function handleGenerateReport() {
    const rows = [
      ['Metric', 'Value'],
      ['Total Sales', SUMMARY.totalSales],
      ['Total Purchases', SUMMARY.totalPurchases],
      ['Net Profit', SUMMARY.netProfit],
      ['Profit Margin %', SUMMARY.profitMargin],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-report.csv'
    a.click()
    URL.revokeObjectURL(url)
    setReportGenerated(true)
    window.setTimeout(() => setReportGenerated(false), 3000)
  }

  return (
    <div className="min-h-full bg-slate-50/80 pb-10">
      <div className="mx-auto max-w-7xl space-y-8 px-1 sm:px-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        ) : null}

        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Financial Reports Dashboard
          </h1>
        </header>

        {/* Hero */}
        <section
          className={[
            'relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 shadow-xl shadow-blue-600/20 sm:p-8 lg:p-10',
            'transition-all duration-700',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          ].join(' ')}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative flex flex-col items-stretch gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl rounded-2xl border border-white/20 bg-white/10 p-6 shadow-inner backdrop-blur-md sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">Overview</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">Financial Analytics</h2>
              <p className="mt-3 text-sm leading-relaxed text-blue-50/90 sm:text-base">
                Comprehensive insights into your business performance and profitability
              </p>
            </div>

            <div className="flex shrink-0 items-center justify-center lg:justify-end">
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/25 bg-white/15 shadow-2xl backdrop-blur-lg sm:h-36 sm:w-36">
                <FileBarChart className="h-16 w-16 text-white/95 sm:h-20 sm:w-20" strokeWidth={1.25} />
              </div>
            </div>
          </div>
        </section>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Sales"
            amount={formatRs(SUMMARY.totalSales)}
            subtitle="Total Revenue"
            icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
            iconBg="bg-blue-50"
            delay={80}
            visible={mounted}
          />
          <SummaryCard
            title="Total Purchases"
            amount={formatRs(SUMMARY.totalPurchases)}
            subtitle="Total Expenses"
            icon={<ShoppingCart className="h-6 w-6 text-rose-500" />}
            iconBg="bg-rose-50"
            delay={160}
            visible={mounted}
          />
          <SummaryCard
            title="Net Profit"
            amount={formatRs(SUMMARY.netProfit)}
            subtitle="Net Income"
            icon={<Wallet className="h-6 w-6 text-emerald-600" />}
            iconBg="bg-emerald-50"
            delay={240}
            visible={mounted}
          />
          <SummaryCard
            title="Profit Margin"
            amount={formatRs(SUMMARY.profitMargin, { percent: true })}
            subtitle="Profit Ratio"
            icon={<Percent className="h-6 w-6 text-cyan-600" />}
            iconBg="bg-cyan-50"
            delay={320}
            visible={mounted}
          />
        </section>

        {/* Charts */}
        <section className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Daily Performance" icon={<LineChart className="h-5 w-5" />} className="lg:col-span-1">
            <div className="h-56 w-full sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DAILY_PERFORMANCE} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailySalesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<FinancialTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#dailySalesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Monthly Trends" icon={<BarChart3 className="h-5 w-5" />} className="lg:col-span-1">
            <div className="h-56 w-full sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHLY_TRENDS} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<FinancialTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="purchases" name="Purchases" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Profit Analysis" icon={<PieChartIcon className="h-5 w-5" />} className="lg:col-span-1">
            <div className="h-56 w-full sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PROFIT_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {PROFIT_DISTRIBUTION.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatRs(Number(value ?? 0))}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </section>

        {/* Bottom CTA */}
        <section
          className={[
            'flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 shadow-xl sm:flex-row sm:px-10',
            'transition-all duration-700 delay-300',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          ].join(' ')}
        >
          <div className="flex items-start gap-4 text-center sm:text-left">
            <div className="hidden rounded-xl bg-white/10 p-3 sm:block">
              <Sparkles className="h-6 w-6 text-amber-300" />
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Analyze sales, profits and expenses and use insights across custom date ranges.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateReport}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 hover:shadow-blue-400/40 active:scale-[0.98]"
          >
            {reportGenerated ? (
              <>
                <TrendingUp className="h-4 w-4" />
                Report Downloaded
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Generate Report
              </>
            )}
          </button>
        </section>
      </div>
    </div>
  )
}
