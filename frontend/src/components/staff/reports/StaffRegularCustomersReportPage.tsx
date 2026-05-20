import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react'
import { saveAs } from 'file-saver'
import { Link } from 'react-router-dom'
import {
  downloadRegularCustomersPdf,
  fetchRegularCustomersReport,
  type RegularCustomerRow,
} from '../../../services/customerReportsApi'
import { staffPath } from '../../../staff/staffRoutes'
import { exportRegularCustomersPdfClient } from '../../../utils/regularCustomersExportClient'
import { useToast } from '../../ui/ToastProvider'
import { formatMoney } from '../../../utils/formatUsd'

const PAGE_SIZE = 12

function engagementBadgeClass(level: string) {
  const key = level.toLowerCase()
  if (key === 'frequent') return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
  if (key === 'regular') return 'bg-green-100 text-green-800 ring-green-200'
  if (key === 'occasional') return 'bg-amber-100 text-amber-800 ring-amber-200'
  return 'bg-slate-100 text-slate-600 ring-slate-200'
}

export function StaffRegularCustomersReportPage() {
  const { showToast } = useToast()
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')
  const [activeFrom, setActiveFrom] = useState('')
  const [activeTo, setActiveTo] = useState('')
  const [rows, setRows] = useState<RegularCustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [exportingPdf, setExportingPdf] = useState(false)

  const dateParams = useMemo(
    () => ({
      fromDate: activeFrom || undefined,
      toDate: activeTo || undefined,
    }),
    [activeFrom, activeTo],
  )

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRegularCustomersReport({
        fromDate: from || undefined,
        toDate: to || undefined,
      })
      setRows(
        data.map((row) => ({
          ...row,
          averageOrderValue:
            row.averageOrderValue > 0
              ? row.averageOrderValue
              : row.purchaseCount > 0
                ? row.totalSpent / row.purchaseCount
                : 0,
        })),
      )
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load regular customers')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(activeFrom, activeTo)
  }, [load, activeFrom, activeTo])

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
  }

  function handleReset() {
    setDraftFrom('')
    setDraftTo('')
    setActiveFrom('')
    setActiveTo('')
  }

  async function handleDownloadPdf() {
    if (rows.length === 0 && !loading) {
      showToast('No data to export for the current filters', 'error')
      return
    }

    setExportingPdf(true)
    try {
      try {
        const { fileName, blob } = await downloadRegularCustomersPdf(dateParams)
        saveAs(blob, fileName)
      } catch {
        exportRegularCustomersPdfClient(rows, activeFrom, activeTo)
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Regular Customers Report
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Repeat buyers, loyalty patterns, and engagement levels across your customer base.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownloadPdf()}
          disabled={exportingPdf || loading || rows.length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:from-emerald-700 hover:to-green-700 hover:shadow-md disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
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
        <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-100 via-green-50 to-teal-50 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold tracking-tight text-emerald-900 sm:text-xl">
            Regular Customers
          </h2>
          <p className="mt-1 text-sm text-emerald-700/90">
            {rows.length > 0
              ? `${rows.length.toLocaleString()} engaged customer${rows.length === 1 ? '' : 's'} in this period`
              : 'Purchase frequency and engagement analysis'}
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-[150px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                From Date
              </span>
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
            <label className="block min-w-[150px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                To Date
              </span>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFilter}
              disabled={loading || exportingPdf}
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:bg-emerald-700 disabled:opacity-50"
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
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <p className="text-sm text-slate-500">Loading regular customers…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-sm font-semibold text-slate-700">No regular customers found</p>
            <p className="mt-1 text-sm text-slate-500">
              Adjust your date range or reset filters to see repeat customer activity.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Purchase Count
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Avg. Value
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Engagement Level
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((row) => (
                    <tr
                      key={row.customerId}
                      className="bg-white transition-colors hover:bg-emerald-50/40"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">{row.customerName}</p>
                        {row.email ? (
                          <p className="mt-0.5 text-xs text-slate-500">{row.email}</p>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-800">
                          {row.purchaseCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold tabular-nums text-slate-900">
                          {formatMoney(row.averageOrderValue)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${engagementBadgeClass(row.engagementLevel)}`}
                        >
                          {row.engagementLevel || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of{' '}
                {rows.length} customers
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
    </div>
  )
}
