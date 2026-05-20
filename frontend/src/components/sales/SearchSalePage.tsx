import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Plus, ReceiptText, Search, AlertCircle, ShoppingCart } from 'lucide-react'
import type { Part } from '../../api'
import { searchCustomers, fetchCustomerDetail, type CustomerDetail, type CustomerSearchResult } from '../../services/customerApi'
import { fetchParts } from '../../services/partsApi'
import { createSale, sendInvoiceEmail, type SaleRecord } from '../../services/salesApi'
import { SearchBar } from '../staff/SearchBar'
import { useToast } from '../ui/ToastProvider'
import { isValidEmail, resolveInvoiceEmail } from '../../lib/emailUtils'

type SaleLine = { partId: number; quantity: number }
type PaymentMethod = 'Cash' | 'Credit'

const LOYALTY_THRESHOLD = 5000
const LOYALTY_RATE = 0.1

function vehicleLabel(c: CustomerSearchResult | CustomerDetail): string {
  const v = 'vehicles' in c && c.vehicles?.length ? c.vehicles[0] : null
  if (v) return `${v.vehicleNumber} (${v.brand} ${v.model})`
  return '—'
}

export function SearchSalePage() {
  const { showToast } = useToast()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [nameQuery, setNameQuery] = useState('')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [vehicleQuery, setVehicleQuery] = useState('')
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([])
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingParts, setLoadingParts] = useState(true)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [currentPartId, setCurrentPartId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [lines, setLines] = useState<SaleLine[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [sellConfirmed, setSellConfirmed] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const inventory = await fetchParts()
        const active = inventory
          .filter((p) => p.isActive)
          .map(
            (p): Part => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.sellingPrice ?? p.price,
              quantity: p.quantity,
              createdAt: p.createdAt,
            }),
          )
        setParts(active)
        if (active.length > 0) setCurrentPartId(active[0].id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load parts')
      } finally {
        setLoadingParts(false)
      }
    })()
  }, [])

  useEffect(() => {
    const fromQuery = Number(searchParams.get('customerId'))
    const fromState = (location.state as { customerId?: number } | null)?.customerId
    const id = Number.isFinite(fromQuery) && fromQuery > 0 ? fromQuery : fromState
    if (typeof id === 'number' && Number.isFinite(id) && id > 0) {
      setSelectedCustomerId(id)
    }
  }, [location.state, searchParams])

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true)
    setError(null)
    try {
      const q = [nameQuery, phoneQuery, vehicleQuery].filter(Boolean).join(' ').trim()
      const results = await searchCustomers(q)
      setCustomers(results)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Customer search failed')
      setCustomers([])
    } finally {
      setLoadingCustomers(false)
    }
  }, [nameQuery, phoneQuery, vehicleQuery])

  useEffect(() => {
    const t = window.setTimeout(() => void loadCustomers(), 300)
    return () => window.clearTimeout(t)
  }, [loadCustomers])

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetail(null)
      return
    }
    void (async () => {
      try {
        const detail = await fetchCustomerDetail(selectedCustomerId)
        setCustomerDetail(detail)
      } catch {
        setCustomerDetail(null)
      }
    })()
  }, [selectedCustomerId])

  useEffect(() => {
    setSellConfirmed(false)
  }, [selectedCustomerId, lines, paymentMethod])

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const vNums = (c.vehicles ?? []).map((v) => v.vehicleNumber.toLowerCase()).join(' ')
      const byName = !nameQuery || c.name.toLowerCase().includes(nameQuery.toLowerCase())
      const byPhone = !phoneQuery || c.phone.includes(phoneQuery)
      const byVehicle = !vehicleQuery || vNums.includes(vehicleQuery.toLowerCase())
      return byName && byPhone && byVehicle
    })
  }, [customers, nameQuery, phoneQuery, vehicleQuery])

  const selectedCustomer = filteredCustomers.find((c) => c.id === selectedCustomerId) ?? null
  const selectedPart = parts.find((p) => p.id === currentPartId) ?? null

  const invoiceRows = useMemo(() => {
    return lines
      .map((line) => {
        const part = parts.find((p) => p.id === line.partId)
        if (!part) return null
        return {
          key: `${line.partId}-${line.quantity}`,
          name: part.name,
          quantity: line.quantity,
          unitPrice: part.price,
          lineTotal: part.price * line.quantity,
          stock: part.quantity,
        }
      })
      .filter(Boolean) as Array<{
      key: string
      name: string
      quantity: number
      unitPrice: number
      lineTotal: number
      stock: number
    }>
  }, [lines, parts])

  const subtotal = invoiceRows.reduce((sum, r) => sum + r.lineTotal, 0)
  const discount = subtotal >= LOYALTY_THRESHOLD ? Math.round(subtotal * LOYALTY_RATE * 100) / 100 : 0
  const grandTotal = subtotal - discount

  function addLine() {
    setError(null)
    if (!selectedPart || quantity <= 0) return
    const inCart = lines.filter((l) => l.partId === selectedPart.id).reduce((s, l) => s + l.quantity, 0)
    if (inCart + quantity > selectedPart.quantity) {
      setError(`Insufficient stock for ${selectedPart.name}. Available: ${selectedPart.quantity}`)
      return
    }
    setLines((prev) => [...prev, { partId: selectedPart.id, quantity }])
    setQuantity(1)
  }

  function handleSell() {
    setError(null)
    if (!selectedCustomerId) {
      setError('Select a customer before selling.')
      return
    }
    if (lines.length === 0) {
      setError('Add at least one item to the cart before selling.')
      return
    }
    setSellConfirmed(true)
    setSuccess(null)
    setLastSale(null)
  }

  async function handleCreateSale() {
    if (!selectedCustomerId || lines.length === 0) {
      setError('Select a customer and add at least one item.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setLastSale(null)
    try {
      const sale = await createSale({
        customerId: selectedCustomerId,
        items: lines,
        paymentStatus: paymentMethod === 'Cash' ? 'Paid' : 'Credit',
      })
      setLastSale(sale)
      setLines([])
      setSellConfirmed(false)
      setSuccess(`Sale saved. Invoice ${sale.invoiceNumber} created.`)
      void loadCustomers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create sale')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSendEmail() {
    if (!lastSale) return
    const email = resolveInvoiceEmail(customerDetail?.email)
    if (!email) {
      showToast('A valid email address is required to send the invoice.', 'error')
      return
    }
    if (!isValidEmail(email)) {
      showToast('Please enter a valid email address.', 'error')
      return
    }
    try {
      await sendInvoiceEmail(lastSale.id, email)
      showToast(`Invoice emailed to ${email}.`, 'success')
      setSuccess(`Invoice emailed to ${email}.`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Email failed'
      setError(msg)
      showToast(msg, 'error')
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search &amp; Sale</h1>
        <p className="mt-1 text-sm text-slate-600">Search customers and create sales from live inventory.</p>
      </header>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}
      {success ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p> : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Search customers</h2>
          <SearchBar value={nameQuery} onChange={setNameQuery} placeholder="Name" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              placeholder="Phone"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
            <input
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Vehicle number"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {loadingCustomers ? (
              <p className="text-sm text-slate-500">Searching…</p>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-sm text-slate-500">No matching customers.</p>
            ) : (
              filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={[
                    'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
                    selectedCustomerId === c.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-slate-600">
                    {c.phone} · {vehicleLabel(c)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Customer details</h2>
          {selectedCustomer && customerDetail ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Customer:</span> {customerDetail.name}
              </p>
              <p>
                <span className="font-semibold">Phone:</span> {customerDetail.phone}
              </p>
              <p>
                <span className="font-semibold">Vehicle:</span> {vehicleLabel(customerDetail)}
              </p>
              <p>
                <span className="font-semibold">Purchases:</span> {customerDetail.totalPurchases} ·{' '}
                <span className="font-semibold">Spent:</span> Rs {customerDetail.totalSpent.toLocaleString()}
              </p>
              {customerDetail.lastPurchaseDate ? (
                <p>
                  <span className="font-semibold">Last purchase:</span>{' '}
                  {new Date(customerDetail.lastPurchaseDate).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a customer from search results.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Sales items</h2>
          {loadingParts ? (
            <p className="text-sm text-slate-500">Loading parts…</p>
          ) : parts.length === 0 ? (
            <p className="text-sm text-slate-500">No parts in inventory.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <select
                  value={currentPartId ?? ''}
                  onChange={(e) => setCurrentPartId(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                      {p.name} — Rs {p.price.toLocaleString()} (stock: {p.quantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={selectedPart?.quantity ?? 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
                />
                <button
                  type="button"
                  onClick={addLine}
                  disabled={!selectedPart || selectedPart.quantity <= 0}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              {selectedPart ? (
                <p className="mt-2 text-xs text-slate-500">In stock: {selectedPart.quantity} units</p>
              ) : null}
            </>
          )}
          <p className="mt-3 text-sm text-slate-600">{lines.length} item(s) in cart.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Invoice preview</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                      No items selected.
                    </td>
                  </tr>
                ) : (
                  invoiceRows.map((row) => (
                    <tr key={row.key}>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.quantity}</td>
                      <td className="px-3 py-2">Rs {row.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">Rs {row.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment method</p>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(['Cash', 'Credit'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={[
                    'rounded-lg px-4 py-2 text-sm font-semibold transition',
                    paymentMethod === method
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900',
                  ].join(' ')}
                >
                  {method}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {paymentMethod === 'Cash'
                ? 'Invoice will be marked as paid in full.'
                : 'Invoice will be recorded as credit with an outstanding balance.'}
            </p>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Loyalty discount (10% over Rs 5,000)</span>
              <span className={discount > 0 ? 'font-semibold text-emerald-700' : ''}>
                - Rs {discount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold">
              <span>Total</span>
              <span>Rs {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSell}
          disabled={!selectedCustomerId || lines.length === 0 || sellConfirmed}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4" />
          {sellConfirmed ? 'Sale confirmed' : 'Sell'}
        </button>
        <button
          type="button"
          onClick={() => void handleCreateSale()}
          disabled={submitting || !sellConfirmed}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          title={!sellConfirmed ? 'Click Sell first to confirm the cart' : undefined}
        >
          {submitting ? 'Saving…' : 'Generate invoice & save sale'}
        </button>
        <button
          type="button"
          onClick={() => {
            setLines([])
            setSellConfirmed(false)
            setSuccess(null)
            setLastSale(null)
            setError(null)
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Clear cart
        </button>
        {sellConfirmed && lines.length > 0 ? (
          <p className="w-full text-sm text-emerald-700">
            Sale ready — {paymentMethod} · Rs {grandTotal.toLocaleString()}. Generate invoice to complete.
          </p>
        ) : lines.length > 0 && selectedCustomerId ? (
          <p className="w-full text-sm text-slate-500">Add items, choose payment, then click Sell to enable invoice generation.</p>
        ) : null}
        {lastSale ? (
          <>
            <Link
              to={`/invoice/print/${lastSale.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100"
            >
              Print invoice
            </Link>
            <button
              type="button"
              onClick={() => void handleSendEmail()}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Email invoice
            </button>
          </>
        ) : null}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <Search className="mt-0.5 h-4 w-4 text-slate-400" />
        Stock is validated against the database when adding items and creating the sale.
      </div>
    </div>
  )
}
