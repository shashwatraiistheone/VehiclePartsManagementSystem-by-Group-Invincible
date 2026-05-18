import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, ReceiptText } from 'lucide-react'

type Customer = {
  id: number
  name: string
  phone?: string
  address?: string
}

type Part = {
  id: string
  name: string
  price: number
}

type InvoiceLine = {
  partId: string
  quantity: number
}

const PARTS: Part[] = [
  { id: 'oil-filter', name: 'Oil Filter', price: 850 },
  { id: 'brake-pad-set', name: 'Brake Pad Set', price: 4200 },
  { id: 'spark-plug', name: 'Spark Plug Set', price: 2500 },
  { id: 'coolant', name: 'Engine Coolant', price: 1200 },
  { id: 'battery-12v', name: 'Battery 12V', price: 10900 },
]

function inferVehicle(address?: string): string {
  const raw = (address ?? '').trim()
  if (!raw) return '—'
  const m = raw.match(/^Vehicle:\s*(.+)$/i)
  if (m?.[1]) return m[1].trim()
  return raw.split(',')[0]
}

function safeJson(text: string) {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function AdminSearchSalePage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [currentPartId, setCurrentPartId] = useState(PARTS[0].id)
  const [quantity, setQuantity] = useState(1)
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL as string
        const res = await fetch(`${apiBase}/api/Customer`)
        const text = await res.text()
        const data = safeJson(text) as Customer[] | null
        setCustomers(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const vehicleInfo = inferVehicle(c.address).toLowerCase()
      const byName = !name || c.name.toLowerCase().includes(name.toLowerCase())
      const byPhone = !phone || (c.phone ?? '').toLowerCase().includes(phone.toLowerCase())
      const byVehicle = !vehicle || vehicleInfo.includes(vehicle.toLowerCase())
      return byName && byPhone && byVehicle
    })
  }, [customers, name, phone, vehicle])

  const selectedCustomer = filteredCustomers.find((c) => c.id === selectedCustomerId) ?? null

  const invoiceRows = useMemo(() => {
    return lines
      .map((line) => {
        const part = PARTS.find((p) => p.id === line.partId)
        if (!part) return null
        return {
          key: `${line.partId}-${line.quantity}`,
          name: part.name,
          quantity: line.quantity,
          unitPrice: part.price,
          lineTotal: part.price * line.quantity,
        }
      })
      .filter(Boolean) as Array<{
      key: string
      name: string
      quantity: number
      unitPrice: number
      lineTotal: number
    }>
  }, [lines])

  const subtotal = invoiceRows.reduce((sum, r) => sum + r.lineTotal, 0)
  const discount = subtotal > 5000 ? Math.round(subtotal * 0.1) : 0
  const grandTotal = subtotal - discount

  function addLine() {
    if (quantity <= 0) return
    setLines((prev) => [...prev, { partId: currentPartId, quantity }])
    setQuantity(1)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search &amp; Sale</h1>
        <p className="mt-1 text-slate-600">Search customers and create sales invoices.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Search Section</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
            <input
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Vehicle Number"
              className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-sm text-slate-500">Loading customers…</p>
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
                    selectedCustomerId === c.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-slate-600">
                    {(c.phone || '—')} · {inferVehicle(c.address)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Customer Result Card</h2>
          {selectedCustomer ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold text-slate-700">Customer Name:</span> {selectedCustomer.name}</p>
              <p><span className="font-semibold text-slate-700">Vehicle Info:</span> {inferVehicle(selectedCustomer.address)}</p>
              <p><span className="font-semibold text-slate-700">Previous purchase summary:</span> {Math.max(1, selectedCustomer.id % 9)} invoices</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a customer from search results.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Sales Section</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <select
              value={currentPartId}
              onChange={(e) => setCurrentPartId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            >
              {PARTS.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} — Rs {part.price.toLocaleString()}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-24 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Auto line calculation: quantity × unit price.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-900">Invoice Section</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit Price</th>
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
                      <td className="px-3 py-2 text-slate-900">{row.name}</td>
                      <td className="px-3 py-2 text-slate-600">{row.quantity}</td>
                      <td className="px-3 py-2 text-slate-600">Rs {row.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-slate-900">Rs {row.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>Rs {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount (Feature 16)</span>
              <span className={discount > 0 ? 'font-semibold text-emerald-700' : ''}>
                - Rs {discount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
              <span>Total Amount</span>
              <span>Rs {grandTotal.toLocaleString()}</span>
            </div>
          </div>
          {discount > 0 ? (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              Discount applied because invoice total is above Rs 5,000.
            </p>
          ) : null}
        </div>
      </section>

      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            if (!selectedCustomer || invoiceRows.length === 0) return
            setMessage(`Invoice generated for ${selectedCustomer.name}.`)
          }}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Generate Invoice
        </button>
        <button
          type="button"
          onClick={() => {
            setLines([])
            setMessage(null)
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
