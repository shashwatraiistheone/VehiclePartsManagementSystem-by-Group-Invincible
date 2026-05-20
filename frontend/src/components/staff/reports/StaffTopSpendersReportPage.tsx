import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sheet,
} from 'lucide-react'
import { saveAs } from 'file-saver'
import { Link } from 'react-router-dom'
import {
  downloadTopSpendersExport,
  fetchTopSpendersReport,
  type TopSpenderRow,
  type TopSpendersExportFormat,
} from '../../../services/customerReportsApi'
import { staffPath } from '../../../staff/staffRoutes'
import { exportTopSpendersClient } from '../../../utils/topSpendersExportClient'
import { useToast } from '../../ui/ToastProvider'
import { formatMoney } from '../../../utils/formatUsd'

const PAGE_SIZE = 12

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function StaffTopSpendersReportPage() {
  const printRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')
  const [activeFrom, setActiveFrom] = useState('')
  const [activeTo, setActiveTo] = useState('')
  const [rows, setRows] = useState<TopSpenderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState<TopSpendersExportFormat | null>(null)

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
      const data = await fetchTopSpendersReport({
        fromDate: from || undefined,
        toDate: to || undefined,
      })
      setRows(data)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load top spenders')
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

  async function handleExport(format: TopSpendersExportFormat) {
    if (rows.length === 0 && !loading) {
      showToast('No data to export for the current filters', 'error')
      return
    }

    setExporting(format)
    try {
      try {
        const { fileName, blob } = await downloadTopSpendersExport(format, dateParams)
        saveAs(blob, fileName)
      } catch {
        exportTopSpendersClient(format, rows, activeFrom, activeTo)
      }
      const label = format === 'excel' ? 'Excel' : format.toUpperCase()
      showToast(`${label} report downloaded successfully`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed', 'error')
    } finally {
      setExporting(null)
    }
  }

  const exportDisabled = loading || exporting !== null || rows.length === 0

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <header>
        <Link
          to={staffPath('customer-reports')}
          className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Customer Reports
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Top Spenders Report</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ranked customer spending analytics — highest lifetime purchasers first.
        </p>
      </header>

      <div
        ref={printRef}
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40 ring-1 ring-slate-100"
      >
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-5 sm:px-8">
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">Top Spenders</h2>
          <p className="mt-1 text-sm text-blue-100">
            {rows.length > 0
              ? `${rows.length.toLocaleString()} customer${rows.length === 1 ? '' : 's'} ranked by total spend`
              : 'Customer purchase rankings'}
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 lg:flex-row lg:items-end lg:justify-between sm:px-6 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block min-w-[150px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                From Date
              </span>
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportButton
              label="Export CSV"
              Icon={Sheet}
              loading={exporting === 'csv'}
              disabled={exportDisabled}
              onClick={() => void handleExport('csv')}
            />
            <ExportButton
              label="Export Excel"
              Icon={FileSpreadsheet}
              loading={exporting === 'excel'}
              disabled={exportDisabled}
              onClick={() => void handleExport('excel')}
            />
            <ExportButton
              label="Export PDF"
              Icon={FileText}
              loading={exporting === 'pdf'}
              disabled={exportDisabled}
              onClick={() => void handleExport('pdf')}
            />
            <button
              type="button"
              onClick={handleFilter}
              disabled={loading || exporting !== null}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:bg-blue-700 disabled:opacity-50"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading || exporting !== null}
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
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading top spenders…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-sm font-semibold text-slate-700">No top spenders found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your date range or reset filters to view all customers.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="w-14 px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      #
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total Spent
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Purchases
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Last Purchase
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((row, index) => {
                    const rank = (page - 1) * PAGE_SIZE + index + 1
                    return (
                      <tr
                        key={row.customerId}
                        className="transition-colors hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                            {rank}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{row.customerName}</p>
                          {row.email ? (
                            <p className="mt-0.5 text-xs text-slate-500">{row.email}</p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-base font-bold tabular-nums text-slate-900">
                            {formatMoney(row.totalSpent)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex min-w-[2rem] items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-slate-800">
                            {row.purchaseCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(row.lastPurchaseDate)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:px-6 print:hidden">
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

function ExportButton({
  label,
  Icon,
  loading,
  disabled,
  onClick,
}: {
  label: string
  Icon: typeof Sheet
  loading: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}
