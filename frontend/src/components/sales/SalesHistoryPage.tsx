import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Mail, Printer, RefreshCw, Search } from 'lucide-react'
import { fetchSales, sendInvoiceEmail, type SaleRecord } from '../../services/salesApi'
import { useToast } from '../ui/ToastProvider'
import { isValidEmail, resolveInvoiceEmail } from '../../lib/emailUtils'

type Filter = 'all' | 'paid' | 'credit' | 'partial'

function paymentLabel(sale: SaleRecord): string {
  const inv = sale.invoice
  if (inv?.paymentStatus) return inv.paymentStatus
  if (inv?.isPaid) return 'Paid'
  return 'Credit'
}

export function SalesHistoryPage() {
  const { showToast } = useToast()
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [actionId, setActionId] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSales(await fetchSales())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    return sales.filter((s) => {
      const status = paymentLabel(s).toLowerCase()
      if (filter === 'paid' && status !== 'paid') return false
      if (filter === 'credit' && status !== 'credit') return false
      if (filter === 'partial' && status !== 'partial') return false
      if (!term) return true
      return (
        s.invoiceNumber.toLowerCase().includes(term) ||
        s.customerName.toLowerCase().includes(term) ||
        String(s.id).includes(term)
      )
    })
  }, [sales, search, filter])

  async function emailInvoice(sale: SaleRecord) {
    setActionId(sale.id)
    setMessage(null)
    const email = resolveInvoiceEmail(sale.customerEmail)
    if (!email || !isValidEmail(email)) {
      showToast('A valid email address is required.', 'error')
      setActionId(null)
      return
    }
    try {
      await sendInvoiceEmail(sale.id, email)
      const msg = `Invoice emailed to ${email}.`
      setMessage(msg)
      showToast(msg, 'success')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Email failed'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales history</h1>
          <p className="mt-1 text-sm text-slate-600">Invoices and sales from the database.</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}

      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, customer, sale ID…"
            className="w-full rounded-lg border py-2 pr-3 pl-10 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All'],
              ['credit', 'Credit'],
              ['partial', 'Partial'],
              ['paid', 'Paid'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold',
                filter === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {loading ? (
          <p className="py-16 text-center text-sm text-slate-500">Loading sales…</p>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No sales found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Final</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {s.invoiceNumber || `Sale #${s.id}`}
                      </div>
                    </td>
                    <td className="px-4 py-3">{s.customerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">Rs {s.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald-700">
                      {s.discount > 0 ? `- Rs ${s.discount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold">Rs {s.finalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">
                        {paymentLabel(s)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/invoice/print/${s.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          title="Print"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Print
                        </Link>
                        <button
                          type="button"
                          disabled={actionId === s.id}
                          onClick={() => void emailInvoice(s)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          title="Email invoice"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
