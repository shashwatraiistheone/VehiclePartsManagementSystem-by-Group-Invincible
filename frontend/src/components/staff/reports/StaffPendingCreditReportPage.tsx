import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Phone,
  User,
  X,
} from 'lucide-react'
import { saveAs } from 'file-saver'
import { Link, useNavigate } from 'react-router-dom'
import {
  downloadPendingCreditsPdf,
  fetchPendingCreditsReport,
  type PendingCreditRow,
} from '../../../services/customerReportsApi'
import { staffCustomerProfilePath, staffPath } from '../../../staff/staffRoutes'
import { exportPendingCreditPdfClient } from '../../../utils/pendingCreditExportClient'
import { useToast } from '../../ui/ToastProvider'
import { formatMoney } from '../../../utils/formatUsd'

const PAGE_SIZE = 12

type OverdueFilter = 'all' | 'current' | 'warning' | 'overdue'

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysBadgeClass(bucket: string) {
  const key = bucket.toLowerCase()
  if (key === 'current') return 'bg-amber-100 text-amber-800 ring-amber-200'
  if (key === 'warning') return 'bg-orange-100 text-orange-800 ring-orange-200'
  return 'bg-rose-100 text-rose-800 ring-rose-200'
}

function daysLabel(days: number, bucket: string) {
  if (bucket === 'overdue') return `${days} days`
  if (bucket === 'warning') return `${days} days`
  return `${days} days`
}

type CallTarget = {
  customerName: string
  phone: string
  invoiceNumber: string
}

export function StaffPendingCreditReportPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [draftOverdue, setDraftOverdue] = useState<OverdueFilter>('all')
  const [activeFrom, setActiveFrom] = useState('')
  const [activeTo, setActiveTo] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [activeOverdue, setActiveOverdue] = useState<OverdueFilter>('all')
  const [outstandingTotal, setOutstandingTotal] = useState(0)
  const [rows, setRows] = useState<PendingCreditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [callTarget, setCallTarget] = useState<CallTarget | null>(null)

  const dateParams = useMemo(
    () => ({
      fromDate: activeFrom || undefined,
      toDate: activeTo || undefined,
      search: activeSearch.trim() || undefined,
      overdueStatus: activeOverdue === 'all' ? undefined : activeOverdue,
    }),
    [activeFrom, activeTo, activeSearch, activeOverdue],
  )

  const load = useCallback(
    async (from: string, to: string, search: string, overdue: OverdueFilter) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchPendingCreditsReport({
          fromDate: from || undefined,
          toDate: to || undefined,
          search: search.trim() || undefined,
          overdueStatus: overdue === 'all' ? undefined : overdue,
        })
        setOutstandingTotal(data.outstandingTotal)
        setRows(data.items)
        setPage(1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pending credits')
        setRows([])
        setOutstandingTotal(0)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    void load(activeFrom, activeTo, activeSearch, activeOverdue)
  }, [load, activeFrom, activeTo, activeSearch, activeOverdue])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function handleFilter() {
    setActiveFrom(draftFrom)
    setActiveTo(draftTo)
    setActiveSearch(draftSearch)
    setActiveOverdue(draftOverdue)
  }

  function handleReset() {
    setDraftFrom('')
    setDraftTo('')
    setDraftSearch('')
    setDraftOverdue('all')
    setActiveFrom('')
    setActiveTo('')
    setActiveSearch('')
    setActiveOverdue('all')
  }

  async function handleDownloadPdf() {
    if (rows.length === 0 && !loading) {
      showToast('No data to export for the current filters', 'error')
      return
    }

    setExportingPdf(true)
    try {
      const report = { outstandingTotal, items: rows }
      try {
        const { fileName, blob } = await downloadPendingCreditsPdf(dateParams)
        saveAs(blob, fileName)
      } catch {
        exportPendingCreditPdfClient(report, activeFrom, activeTo)
      }
      showToast('PDF report downloaded successfully', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'PDF export failed', 'error')
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={staffPath('customer-reports')}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Customer Reports
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pending Credit Report</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor unpaid invoices, overdue balances, and customer follow-up actions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownloadPdf()}
          disabled={exportingPdf || loading || rows.length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-500/25 transition hover:-translate-y-0.5 hover:from-rose-700 hover:to-red-700 hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
        >
          {exportingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Download PDF
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40 ring-1 ring-slate-100">
        <div className="flex flex-col gap-4 border-b border-rose-100/80 bg-gradient-to-r from-rose-100 via-red-50 to-pink-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-rose-900 sm:text-xl">Pending Credits</h2>
            <p className="mt-1 text-sm text-rose-700/90">
              {rows.length > 0
                ? `${rows.length} open invoice${rows.length === 1 ? '' : 's'} requiring collection`
                : 'No outstanding credit invoices'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800 ring-1 ring-amber-200">
              Current (0–30 days)
            </span>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800 ring-1 ring-orange-200">
              Warning (31–60 days)
            </span>
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800 ring-1 ring-rose-200">
              Overdue (60+ days)
            </span>
          </div>
        </div>

        <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 sm:px-8">
          <p className="text-sm font-bold text-blue-900">
            Outstanding Total:{' '}
            <span className="text-lg tabular-nums">{formatMoney(outstandingTotal)}</span>
          </p>
          <p className="mt-0.5 text-xs text-blue-700/90">
            Total amount currently pending across all invoices.
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 lg:flex-row lg:items-end lg:justify-between sm:px-6">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                From Date
              </span>
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                To Date
              </span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Customer Search
              </span>
              <input
                type="search"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                placeholder="Name, invoice, phone…"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Overdue Status
              </span>
              <select
                value={draftOverdue}
                onChange={(e) => setDraftOverdue(e.target.value as OverdueFilter)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All</option>
                <option value="current">Current (0–30)</option>
                <option value="warning">Warning (31–60)</option>
                <option value="overdue">Overdue (60+)</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFilter}
              disabled={loading || exportingPdf}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || exportingPdf}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        {error ? (
          <div className="mx-5 my-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-6">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
            <p className="text-sm text-slate-500">Loading pending credits…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-sm font-semibold text-slate-700">No pending credit invoices found</p>
            <p className="mt-1 text-sm text-slate-500">
              Adjust filters or reset to view all outstanding balances.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Amount Due</th>
                    <th className="px-4 py-3.5">Sales Date</th>
                    <th className="px-4 py-3.5">Days Outstanding</th>
                    <th className="px-4 py-3.5">Contact Info</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((row) => (
                    <tr key={row.invoiceId} className="transition-colors hover:bg-rose-50/30">
                      <td className="px-5 py-4 font-semibold text-slate-900">{row.invoiceNumber}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{row.customerName}</p>
                        <p className="text-xs text-slate-500">{row.status}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold tabular-nums text-rose-700">
                          {formatMoney(row.outstandingAmount)}
                        </p>
                        <p className="text-xs text-slate-500">of {formatMoney(row.originalAmount)}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(row.salesDate)}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ring-inset ${daysBadgeClass(row.agingBucket)}`}
                        >
                          {daysLabel(row.daysOutstanding, row.agingBucket)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-slate-600">{row.customerPhone || '—'}</p>
                        <p className="truncate text-xs text-slate-400">{row.customerEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={!row.customerPhone}
                            onClick={() =>
                              setCallTarget({
                                customerName: row.customerName,
                                phone: row.customerPhone,
                                invoiceNumber: row.invoiceNumber,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Call
                          </button>
                          <button
                            type="button"
                            disabled={row.customerId <= 0}
                            onClick={() => navigate(staffCustomerProfilePath(row.customerId))}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
                          >
                            <User className="h-3.5 w-3.5" />
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of{' '}
                {rows.length} invoices
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="px-3 text-xs font-semibold tabular-nums text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {callTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setCallTarget(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setCallTarget(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Phone className="h-6 w-6" />
              </span>
              <div>
                <p className="font-bold text-slate-900">{callTarget.customerName}</p>
                <p className="text-xs text-slate-500">Invoice {callTarget.invoiceNumber}</p>
              </div>
              <p className="text-lg font-semibold tabular-nums text-slate-800">{callTarget.phone}</p>
              <a
                href={`tel:${callTarget.phone.replace(/\s/g, '')}`}
                className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
