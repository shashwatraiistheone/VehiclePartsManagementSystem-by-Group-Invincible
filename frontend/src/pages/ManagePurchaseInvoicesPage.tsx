import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Loader2, Plus, Search } from 'lucide-react'
import { PurchaseInvoiceDetailsModal } from '../components/admin/PurchaseInvoiceDetailsModal'
import { ApiErrorAlert } from '../components/ui/ApiErrorAlert'
import { extractApiErrorMessage } from '../lib/apiClient'
import { fetchPurchases, type PurchaseInvoice } from '../services/purchaseApi'
import { formatPurchaseDate, formatUsd } from '../utils/formatUsd'

const PAGE_SIZES = [10, 25, 50, 100] as const

type Props = {
  onNavigateCreate?: () => void
  onBack?: () => void
}

export default function ManagePurchaseInvoicesPage({ onNavigateCreate, onBack }: Props) {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(1)
  const [details, setDetails] = useState<PurchaseInvoice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchPurchases()
      setInvoices(rows)
    } catch (e) {
      setError(extractApiErrorMessage(e, 'Failed to load purchase invoices.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter((inv) => {
      const haystack = [
        inv.invoiceNumber,
        inv.vendorName,
        inv.processedBy,
        formatPurchaseDate(inv.purchaseDate),
        inv.purchaseDate,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [invoices, search])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="min-h-full space-y-6 bg-slate-100/80 p-1 sm:p-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back
            </button>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Purchase Invoices
          </h1>
          <p className="mt-1 text-slate-600">Vendor purchase history and invoice records.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateCreate?.()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/40"
        >
          <Plus className="h-4 w-4" />
          Record New Purchase
        </button>
      </header>

      {error ? (
        <ApiErrorAlert message={error} onRetry={() => void load()} />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </label>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter invoices"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading purchase invoices…
          </div>
        ) : pageRows.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-500">
            {search ? 'No invoices match your filter.' : 'No purchase invoices recorded yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Purchase Date</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Processed By</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-100 transition-colors duration-200 hover:bg-slate-50 ${
                      idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{row.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatPurchaseDate(row.purchaseDate)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.vendorName}</td>
                    <td className="px-4 py-3 text-slate-700">{row.processedBy || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 tabular-nums">
                      {formatUsd(row.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetails(row)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all duration-200 hover:bg-blue-100 hover:shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        DETAILS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > pageSize ? (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of{' '}
              {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {details ? (
        <PurchaseInvoiceDetailsModal invoice={details} onClose={() => setDetails(null)} />
      ) : null}
    </div>
  )
}
