import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Percent,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchFinancialReport, type FinancialBreakdown, type FinancialReport } from '../../services/reportApi'
import {
  ChartTooltipContent,
  PaginationBtn,
  RevenuePctBadge,
  SortHeader,
  SummaryCard,
  computeGrowthPercent,
  computeRevenuePct,
  formatPct,
  formatRs,
  toIsoDate,
  type PerformanceRow,
  type SortDir,
  type SortKey,
} from './financialPerformanceShared'

export type PerformanceReportVariant = 'daily' | 'monthly'

type Props = {
  variant: PerformanceReportVariant
  onBack?: () => void
}

const CONFIG = {
  daily: {
    badge: 'Daily Performance Review',
    subtitle: 'Hourly revenue, purchases, and profit analysis for daily business performance tracking',
    summaryTitles: ['Total Daily Revenue', 'Total Daily Purchases', 'Net Profit', 'Revenue Growth'] as const,
    summarySubtitles: ['Total daily sales', 'Total daily expenses', 'Overall daily profit/loss', 'vs. previous day'] as const,
    chartTitle: 'Revenue & Profit Trends (Hourly)',
    chartSubtitle: 'Revenue vs expenses with profit fluctuation throughout the day',
    tableTitle: 'Daily Financial Breakdown',
    tableSubtitle: 'Hour-by-hour sales, purchases, and profit metrics',
    periodColumn: 'Hour',
    totalRowLabel: 'Daily Total',
    exportPrefix: 'daily-financial-report',
    pageSize: 8,
    rowUnit: 'hours',
  },
  monthly: {
    badge: 'Monthly Performance Review',
    subtitle: 'Daily revenue, purchases, and profit analysis for monthly business performance tracking',
    summaryTitles: ['Total Monthly Revenue', 'Total Monthly Purchases', 'Net Profit', 'Revenue Growth'] as const,
    summarySubtitles: ['Total monthly sales', 'Total monthly expenses', 'Overall monthly profit/loss', 'vs. previous month'] as const,
    chartTitle: 'Revenue & Profit Trends (Daily)',
    chartSubtitle: 'Revenue vs expenses with profit fluctuation across the month',
    tableTitle: 'Monthly Financial Breakdown',
    tableSubtitle: 'Day-by-day sales, purchases, and profit metrics',
    periodColumn: 'Day',
    totalRowLabel: 'Monthly Total',
    exportPrefix: 'monthly-financial-report',
    pageSize: 7,
    rowUnit: 'days',
  },
} as const

function mapBreakdown(rows: FinancialBreakdown[]): PerformanceRow[] {
  return rows.map((b) => {
    const revenue = Number(b.revenue) || 0
    const purchases = Number(b.purchaseCost) || 0
    const profit = Number(b.grossProfit) || 0
    return {
      label: b.label,
      labelShort: b.label,
      revenue,
      purchases,
      profit,
      revenuePct: computeRevenuePct(revenue, profit),
    }
  })
}

function formatDailyTitle(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatMonthlyTitle(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function shiftDate(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export function PerformanceOverviewPage({ variant, onBack }: Props) {
  const cfg = CONFIG[variant]
  const today = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(today))
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const m = String(today.getMonth() + 1).padStart(2, '0')
    return `${today.getFullYear()}-${m}`
  })

  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [growth, setGrowth] = useState(0)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('label')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const parsedDate = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate])
  const [monthYear, monthNum] = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    return [y, m] as const
  }, [selectedMonth])

  const titleLabel =
    variant === 'daily'
      ? formatDailyTitle(parsedDate)
      : formatMonthlyTitle(monthYear, monthNum)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let current: FinancialReport
      let previous: FinancialReport

      if (variant === 'daily') {
        const from = selectedDate
        current = await fetchFinancialReport({ period: 'daily', from })
        const prev = shiftDate(parsedDate, -1)
        previous = await fetchFinancialReport({ period: 'daily', from: toIsoDate(prev) })
      } else {
        const from = `${monthYear}-${String(monthNum).padStart(2, '0')}-01`
        current = await fetchFinancialReport({ period: 'monthly', from })
        const prev = shiftMonth(monthYear, monthNum, -1)
        const prevFrom = `${prev.year}-${String(prev.month).padStart(2, '0')}-01`
        previous = await fetchFinancialReport({ period: 'monthly', from: prevFrom })
      }

      setReport(current)
      setGrowth(computeGrowthPercent(Number(current.revenue) || 0, Number(previous.revenue) || 0))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
      setReport(null)
      setGrowth(0)
    } finally {
      setLoading(false)
    }
  }, [variant, selectedDate, parsedDate, monthYear, monthNum])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    void loadReport()
    setPage(1)
  }, [loadReport])

  const rows = useMemo(() => mapBreakdown(report?.breakdown ?? []), [report])

  const sortedRows = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'label') {
        cmp = a.label.localeCompare(b.label)
      } else {
        cmp = a[sortKey] - b[sortKey]
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [rows, sortKey, sortDir])

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          revenue: acc.revenue + r.revenue,
          purchases: acc.purchases + r.purchases,
          profit: acc.profit + r.profit,
        }),
        { revenue: 0, purchases: 0, profit: 0 },
      ),
    [rows],
  )

  const summary = {
    revenue: Number(report?.revenue) || totals.revenue,
    purchases: Number(report?.purchaseCost) || totals.purchases,
    netProfit: Number(report?.grossProfit) ?? totals.profit,
    growth,
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / cfg.pageSize))
  const pageRows = useMemo(() => {
    const start = (page - 1) * cfg.pageSize
    return sortedRows.slice(start, start + cfg.pageSize)
  }, [sortedRows, page, cfg.pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        name: r.labelShort,
        Revenue: r.revenue,
        Purchases: r.purchases,
        'Profit Trend': r.profit,
      })),
    [rows],
  )

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'label' ? 'asc' : 'desc')
    }
  }

  function handleExport() {
    const header = [cfg.periodColumn, 'Sales Revenue', 'Purchases', 'Profit', 'Revenue %']
    const lines = rows.map((r) => [r.label, r.revenue, r.purchases, r.profit, r.revenuePct])
    const totalLine = [cfg.totalRowLabel, summary.revenue, summary.purchases, summary.netProfit, summary.growth]
    const csv = [header, ...lines, totalLine].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const slug =
      variant === 'daily' ? selectedDate : `${monthYear}-${String(monthNum).padStart(2, '0')}`
    a.download = `${cfg.exportPrefix}-${slug}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const overviewTitle =
    variant === 'daily'
      ? `Daily Performance Overview — ${titleLabel}`
      : `Monthly Performance Overview — ${titleLabel}`

  return (
    <div className="min-h-full bg-slate-50/80 pb-12">
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

        <header
          className={[
            'flex flex-col gap-5 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-md sm:flex-row sm:items-start sm:justify-between sm:p-8',
            'transition-all duration-700',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          ].join(' ')}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{cfg.badge}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{overviewTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">{cfg.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {variant === 'daily' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-100/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-100/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm"
              />
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !rows.length}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {variant === 'daily' ? 'Export Daily Report' : 'Export Monthly Report'}
            </button>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title={cfg.summaryTitles[0]}
            amount={formatRs(summary.revenue)}
            subtitle={cfg.summarySubtitles[0]}
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            delay={80}
            visible={mounted && !loading}
          />
          <SummaryCard
            title={cfg.summaryTitles[1]}
            amount={formatRs(summary.purchases)}
            subtitle={cfg.summarySubtitles[1]}
            icon={<ShoppingCart className="h-5 w-5 text-rose-500" />}
            className="bg-rose-50/30"
            delay={160}
            visible={mounted && !loading}
          />
          <SummaryCard
            title={cfg.summaryTitles[2]}
            amount={formatRs(summary.netProfit)}
            subtitle={cfg.summarySubtitles[2]}
            icon={<Wallet className="h-5 w-5 text-emerald-700" />}
            className="border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/80"
            delay={240}
            visible={mounted && !loading}
          />
          <SummaryCard
            title={cfg.summaryTitles[3]}
            amount={formatPct(summary.growth)}
            subtitle={cfg.summarySubtitles[3]}
            icon={<Percent className="h-5 w-5 text-violet-600" />}
            className="bg-violet-50/40"
            delay={320}
            visible={mounted && !loading}
          />
        </section>

        <section
          className={[
            'rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7',
            'transition-all duration-700 delay-150',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          ].join(' ')}
        >
          <header className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{cfg.chartTitle}</h2>
              <p className="text-xs text-slate-500 sm:text-sm">{cfg.chartSubtitle}</p>
            </div>
          </header>
          <div className="h-80 w-full sm:h-96">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={52} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={variant === 'daily' ? 18 : 28} />
                  <Bar dataKey="Purchases" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={variant === 'daily' ? 18 : 28} />
                  <Line
                    type="monotone"
                    dataKey="Profit Trend"
                    stroke="#334155"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#334155' }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7 sm:py-6">
            <h2 className="text-lg font-bold text-slate-900">{cfg.tableTitle}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{cfg.tableSubtitle}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-4 sm:px-7">
                    <SortHeader
                      label={cfg.periodColumn}
                      sortKey="label"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  </th>
                  <th className="px-5 py-4 sm:px-7">
                    <SortHeader
                      label="Sales Revenue"
                      sortKey="revenue"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                  </th>
                  <th className="px-5 py-4 sm:px-7">
                    <SortHeader
                      label="Purchases"
                      sortKey="purchases"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                  </th>
                  <th className="px-5 py-4 sm:px-7">
                    <SortHeader
                      label="Profit"
                      sortKey="profit"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="right"
                    />
                  </th>
                  <th className="px-5 py-4 text-center sm:px-7">
                    <SortHeader
                      label="Revenue %"
                      sortKey="revenuePct"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                      align="center"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: cfg.pageSize }).map((_, i) => (
                      <tr key={`sk-${i}`} className="border-b border-slate-100">
                        <td colSpan={5} className="px-7 py-5">
                          <div className="h-4 animate-pulse rounded bg-slate-200" />
                        </td>
                      </tr>
                    ))
                  : pageRows.map((row, index) => (
                      <tr
                        key={row.label}
                        className={[
                          'border-b border-slate-100 transition-colors duration-200',
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                          'hover:bg-blue-50/40',
                        ].join(' ')}
                      >
                        <td className="px-5 py-4 font-medium text-slate-900 sm:px-7">{row.label}</td>
                        <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-800 sm:px-7">
                          {formatRs(row.revenue)}
                        </td>
                        <td className="px-5 py-4 text-right text-sm tabular-nums text-slate-800 sm:px-7">
                          {formatRs(row.purchases)}
                        </td>
                        <td
                          className={[
                            'px-5 py-4 text-right text-sm font-semibold tabular-nums sm:px-7',
                            row.profit < 0 ? 'text-rose-600' : 'text-emerald-600',
                          ].join(' ')}
                        >
                          {formatRs(row.profit)}
                        </td>
                        <td className="px-5 py-4 text-center sm:px-7">
                          <RevenuePctBadge value={row.revenuePct} />
                        </td>
                      </tr>
                    ))}
                {!loading ? (
                  <tr className="border-t-2 border-slate-200 bg-slate-100/80 font-semibold">
                    <td className="px-5 py-4 text-slate-900 sm:px-7">{cfg.totalRowLabel}</td>
                    <td className="px-5 py-4 text-right tabular-nums text-slate-900 sm:px-7">
                      {formatRs(summary.revenue)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-slate-900 sm:px-7">
                      {formatRs(summary.purchases)}
                    </td>
                    <td
                      className={[
                        'px-5 py-4 text-right tabular-nums sm:px-7',
                        summary.netProfit < 0 ? 'text-rose-700' : 'text-emerald-700',
                      ].join(' ')}
                    >
                      {formatRs(summary.netProfit)}
                    </td>
                    <td className="px-5 py-4 text-center sm:px-7">
                      <RevenuePctBadge value={summary.growth} />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:px-7">
            <p className="text-sm text-slate-600">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Loading financial data…
                </span>
              ) : (
                <>
                  Page {page} of {totalPages}
                  <span className="mx-2 text-slate-300">·</span>
                  {sortedRows.length} {cfg.rowUnit}
                </>
              )}
            </p>
            <div className="flex items-center gap-1">
              <PaginationBtn
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(n)}
                  className={[
                    'flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-semibold transition',
                    page === n
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
              <PaginationBtn
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationBtn>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export function DailyPerformanceReportPage(props: Omit<Props, 'variant'>) {
  return <PerformanceOverviewPage variant="daily" {...props} />
}

export function MonthlyPerformanceReportPage(props: Omit<Props, 'variant'>) {
  return <PerformanceOverviewPage variant="monthly" {...props} />
}
