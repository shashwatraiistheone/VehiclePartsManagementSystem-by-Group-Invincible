import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Search,
  Star,
  X,
} from 'lucide-react'
import {
  fetchPendingCreditsReport,
  fetchRegularCustomersReport,
  fetchTopSpendersReport,
  type PendingCreditRow,
  type RegularCustomerRow,
  type ReportDateParams,
  type TopSpenderRow,
} from '../../../services/customerReportsApi'
import { formatMoney } from '../../../utils/formatUsd'

export type ReportKind = 'top-spenders' | 'regular-customers' | 'pending-credits'

type Props = {
  kind: ReportKind
  dateParams: ReportDateParams
  search: string
  onClose: () => void
}

const REPORT_META: Record<
  ReportKind,
  { title: string; subtitle: string; Icon: typeof Star; accent: string }
> = {
  'top-spenders': {
    title: 'Top Spenders',
    subtitle: 'Customers with the highest lifetime purchase value',
    Icon: Star,
    accent: 'text-amber-500 bg-amber-50 ring-amber-100',
  },
  'regular-customers': {
    title: 'Regular Customers',
    subtitle: 'Frequent buyers and high-engagement customers',
    Icon: ClipboardList,
    accent: 'text-blue-600 bg-blue-50 ring-blue-100',
  },
  'pending-credits': {
    title: 'Pending Credits',
    subtitle: 'Unpaid credit invoices and overdue accounts',
    Icon: AlertTriangle,
    accent: 'text-rose-600 bg-rose-50 ring-rose-100',
  },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function escapeCsv(value: string | number) {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function StaffCustomerReportDetailModal({ kind, dateParams, search, onClose }: Props) {
  const meta = REPORT_META[kind]
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState(search)
  const [topSpenders, setTopSpenders] = useState<TopSpenderRow[]>([])
  const [regular, setRegular] = useState<RegularCustomerRow[]>([])
  const [pending, setPending] = useState<PendingCreditRow[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = { ...dateParams, search: localSearch.trim() || undefined }
    try {
      if (kind === 'top-spenders') {
        setTopSpenders(await fetchTopSpendersReport(params))
      } else if (kind === 'regular-customers') {
        setRegular(await fetchRegularCustomersReport(params))
      } else {
        const pendingReport = await fetchPendingCreditsReport(params)
        setPending(pendingReport.items)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [kind, dateParams, localSearch])

  useEffect(() => {
    void load()
  }, [load])

  function handleExportCsv() {
    if (kind === 'top-spenders') {
      downloadCsv(
        'top-spenders.csv',
        ['Customer', 'Total Spent', 'Loyalty Points', 'Purchases', 'Last Purchase', 'Tier'],
        topSpenders.map((r) => [
          r.customerName,
          r.totalSpent.toFixed(2),
          r.loyaltyPoints,
          r.purchaseCount,
          formatDate(r.lastPurchaseDate),
          r.loyaltyTier,
        ]),
      )
    } else if (kind === 'regular-customers') {
      downloadCsv(
        'regular-customers.csv',
        ['Customer', 'Purchases', 'Monthly Visits', 'Tier', 'Engagement', 'Total Spent'],
        regular.map((r) => [
          r.customerName,
          r.purchaseCount,
          r.monthlyVisits,
          r.loyaltyTier,
          r.engagementScore,
          r.totalSpent.toFixed(2),
        ]),
      )
    } else {
      downloadCsv(
        'pending-credits.csv',
        ['Invoice', 'Customer', 'Outstanding', 'Overdue Days', 'Due Date', 'Status'],
        pending.map((r) => [
          r.invoiceNumber,
          r.customerName,
          r.outstandingAmount.toFixed(2),
          r.overdueDays,
          formatDate(r.dueDate),
          r.status,
        ]),
      )
    }
  }

  function handleExportPdf() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm print:hidden"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        ref={printRef}
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl print:max-h-none print:shadow-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 print:border-slate-300">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full ring-1 ${meta.accent}`}
            >
              <meta.Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{meta.title}</h2>
              <p className="text-sm text-slate-500">{meta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 print:hidden"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 print:hidden">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void load()
              }}
              placeholder="Search customers…"
              className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Loading report…</p>
            </div>
          ) : error ? (
            <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : kind === 'top-spenders' ? (
            <ReportTable
              empty="No top spenders found for this period."
              headers={['Customer', 'Total Spent', 'Loyalty Pts', 'Purchases', 'Last Purchase', 'Tier']}
              rows={topSpenders.map((r) => [
                <span key="n" className="font-semibold text-slate-900">{r.customerName}</span>,
                <span key="t" className="font-bold tabular-nums">{formatMoney(r.totalSpent)}</span>,
                <span key="l" className="tabular-nums">{r.loyaltyPoints.toLocaleString()}</span>,
                <span key="p">{r.purchaseCount}</span>,
                <span key="d" className="text-slate-600">{formatDate(r.lastPurchaseDate)}</span>,
                <TierBadge key="tier" tier={r.loyaltyTier} />,
              ])}
            />
          ) : kind === 'regular-customers' ? (
            <ReportTable
              empty="No regular customers found for this period."
              headers={['Customer', 'Purchases', 'Monthly Visits', 'Tier', 'Engagement', 'Total Spent']}
              rows={regular.map((r) => [
                <span key="n" className="font-semibold text-slate-900">{r.customerName}</span>,
                <span key="p">{r.purchaseCount}</span>,
                <span key="m">{r.monthlyVisits}</span>,
                <TierBadge key="tier" tier={r.loyaltyTier} />,
                <EngagementBar key="e" score={r.engagementScore} />,
                <span key="t" className="font-semibold tabular-nums">{formatMoney(r.totalSpent)}</span>,
              ])}
            />
          ) : (
            <ReportTable
              empty="No pending credit invoices found."
              headers={['Invoice', 'Customer', 'Outstanding', 'Age', 'Due Date', 'Status']}
              rows={pending.map((r) => [
                <span key="inv" className="font-semibold text-slate-900">{r.invoiceNumber}</span>,
                <span key="c">
                  <span className="block font-medium text-slate-900">{r.customerName}</span>
                  <span className="text-xs text-slate-500">{r.customerEmail}</span>
                </span>,
                <span key="o" className="font-bold tabular-nums text-rose-700">
                  {formatMoney(r.outstandingAmount)}
                </span>,
                <OverdueBadge key="age" days={r.overdueDays} />,
                <span key="d" className="text-slate-600">{formatDate(r.dueDate)}</span>,
                <StatusBadge key="s" status={r.status} />,
              ])}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ReportTable({
  headers,
  rows,
  empty,
}: {
  headers: string[]
  rows: ReactNode[][]
  empty: string
}) {
  if (rows.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">{empty}</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((cells, i) => (
            <tr key={i} className="transition hover:bg-slate-50/80">
              {cells.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const t = tier.toUpperCase()
  const cls =
    t.includes('GOLD PLUS')
      ? 'bg-amber-100 text-amber-900 ring-amber-200'
      : t.includes('GOLD')
        ? 'bg-yellow-50 text-yellow-800 ring-yellow-200'
        : t.includes('SILVER')
          ? 'bg-slate-100 text-slate-700 ring-slate-200'
          : 'bg-blue-50 text-blue-700 ring-blue-200'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${cls}`}>
      {tier}
    </span>
  )
}

function EngagementBar({ score }: { score: number }) {
  return (
    <div className="flex min-w-[100px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums text-slate-700">{score}</span>
    </div>
  )
}

function OverdueBadge({ days }: { days: number }) {
  if (days <= 0) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
        Current
      </span>
    )
  }
  const cls =
    days <= 30
      ? 'bg-amber-50 text-amber-800 ring-amber-200'
      : days <= 90
        ? 'bg-orange-50 text-orange-800 ring-orange-200'
        : 'bg-rose-50 text-rose-800 ring-rose-200'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${cls}`}>
      {days} {days === 1 ? 'day' : 'days'}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const cls =
    s === 'paid'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : s === 'partial'
        ? 'bg-sky-50 text-sky-800 ring-sky-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200'
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${cls}`}>
      {status}
    </span>
  )
}
