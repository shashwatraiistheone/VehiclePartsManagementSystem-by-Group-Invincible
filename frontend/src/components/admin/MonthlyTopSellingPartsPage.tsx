import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Package,
  Search,
  TrendingUp,
} from 'lucide-react'

type Props = {
  onBack?: () => void
}

type TopPartRow = {
  rank: number
  partName: string
  quantitySold: number
  revenue: number
}

const REPORT_MONTH = 'April'

const TOP_PARTS: TopPartRow[] = [
  { rank: 1, partName: 'Engine Mount', quantitySold: 48, revenue: 45_000 },
  { rank: 2, partName: 'Air Filter', quantitySold: 132, revenue: 12_000 },
  { rank: 3, partName: 'PVC Valve', quantitySold: 86, revenue: 8_500 },
  { rank: 4, partName: 'Timing Controller (Manual)', quantitySold: 34, revenue: 38_750 },
  { rank: 5, partName: 'Battery Installation', quantitySold: 29, revenue: 52_400 },
  { rank: 6, partName: 'Throttle Body', quantitySold: 41, revenue: 31_200 },
  { rank: 7, partName: 'Brake Fluid & Oil', quantitySold: 156, revenue: 18_900 },
  { rank: 8, partName: 'Steering Rack', quantitySold: 22, revenue: 67_500 },
  { rank: 9, partName: 'Oil Filter (Premium)', quantitySold: 198, revenue: 24_600 },
  { rank: 10, partName: 'Fuel Injector Set (Standard)', quantitySold: 37, revenue: 41_800 },
]

const PAGE_SIZE = 5

function formatRs(amount: number) {
  return `Rs. ${amount.toLocaleString('en-IN')}`
}

export function MonthlyTopSellingPartsPage({ onBack }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const t = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return TOP_PARTS
    return TOP_PARTS.filter((row) => row.partName.toLowerCase().includes(q))
  }, [search])

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, row) => sum + row.revenue, 0),
    [filtered],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function handleExport() {
    const header = ['Rank', 'Part Name', 'Quantity Sold', 'Total Revenue (Rs)']
    const lines = filtered.map((r) => [r.rank, r.partName, r.quantitySold, r.revenue])
    const csv = [header, ...lines].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `top-selling-parts-${REPORT_MONTH.toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-full bg-slate-50/80 pb-10">
      <div className="mx-auto max-w-6xl space-y-6 px-1 sm:px-2">
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
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Inventory Analytics</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Monthly Financial Performance
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Best-performing parts by sales volume and revenue for the selected reporting period.
          </p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100">
          {/* Card header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Top 10 Selling Parts ({REPORT_MONTH})
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Ranked by total revenue · {filtered.length} parts listed
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search parts…"
                  className="w-full rounded-full border border-slate-200/80 bg-slate-100/80 py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={loading || filtered.length === 0}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-7">
                    Rank
                  </th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-7">
                    Part Name
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-7">
                    Quantity Sold
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-7">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                      <tr key={`sk-${i}`} className="border-b border-slate-100">
                        <td colSpan={4} className="px-7 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                              <div className="h-2 w-1/3 animate-pulse rounded bg-slate-100" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  : pageRows.length === 0
                    ? (
                        <tr>
                          <td colSpan={4} className="px-7 py-16 text-center text-sm text-slate-500">
                            No parts match your search.
                          </td>
                        </tr>
                      )
                    : pageRows.map((row, index) => (
                        <tr
                          key={row.rank}
                          className={[
                            'border-b border-slate-100 transition-colors duration-200',
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70',
                            'hover:bg-blue-50/50',
                          ].join(' ')}
                        >
                          <td className="px-5 py-4 sm:px-7">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                              {row.rank}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-900 sm:px-7">{row.partName}</td>
                          <td className="px-5 py-4 text-center sm:px-7">
                            <span className="inline-flex min-w-[3rem] items-center justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-100">
                              {row.quantitySold.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-semibold tabular-nums text-slate-900 sm:px-7">
                            {formatRs(row.revenue)}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              )}
              <span>
                Page {page} of {totalPages}
                <span className="mx-2 text-slate-300">·</span>
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center justify-center gap-1">
                <PaginationButton
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationButton>
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
                <PaginationButton
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationButton>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white px-5 py-3 text-right shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Monthly Revenue
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">
                  {loading ? (
                    <span className="inline-block h-6 w-28 animate-pulse rounded bg-slate-200" />
                  ) : (
                    formatRs(totalRevenue)
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function PaginationButton({
  children,
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  'aria-label': string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}
