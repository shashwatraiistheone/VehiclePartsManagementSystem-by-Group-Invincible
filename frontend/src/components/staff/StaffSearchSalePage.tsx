import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { Invoice } from './Invoice'
import type { Customer, PartOption, SaleLine } from './customerModule'
import { PARTS_CATALOG, getPartById, toDisplayDate } from './customerModule'

type Props = {
  customers: Customer[]
  onRecordSale: (customerId: number, totalLines: number) => void
}

export function StaffSearchSalePage({ customers, onRecordSale }: Props) {
  const [nameQuery, setNameQuery] = useState('')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [vehicleQuery, setVehicleQuery] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [line, setLine] = useState<SaleLine>({ partId: PARTS_CATALOG[0].id, quantity: 1 })
  const [lines, setLines] = useState<SaleLine[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const matches = useMemo(() => {
    return customers.filter((c) => {
      const okName = !nameQuery || c.name.toLowerCase().includes(nameQuery.toLowerCase())
      const okPhone = !phoneQuery || c.phone.includes(phoneQuery)
      const okVehicle = !vehicleQuery || c.vehicleNumber.toLowerCase().includes(vehicleQuery.toLowerCase())
      return okName && okPhone && okVehicle
    })
  }, [customers, nameQuery, phoneQuery, vehicleQuery])

  const selected = matches.find((m) => m.id === selectedCustomerId) ?? null

  const invoiceLines = useMemo(
    () =>
      lines
        .map((l) => {
          const part = getPartById(l.partId)
          if (!part) return null
          return { name: part.name, unitPrice: part.price, quantity: l.quantity }
        })
        .filter(Boolean) as { name: string; unitPrice: number; quantity: number }[],
    [lines],
  )

  function addLine() {
    if (line.quantity <= 0) return
    setLines((prev) => [...prev, line])
    setLine({ partId: PARTS_CATALOG[0].id, quantity: 1 })
  }

  function clearAll() {
    setLines([])
    setMessage(null)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 bg-gray-100 p-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search &amp; Sale</h1>
        <p className="mt-1 text-sm text-slate-600">Search customers and create sales invoices.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-md">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Search Customers</h2>
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
              placeholder="Vehicle Number"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>

          <div className="mt-4 space-y-2">
            {matches.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedCustomerId(customer.id)}
                className={[
                  'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
                  selectedCustomerId === customer.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50',
                ].join(' ')}
              >
                <p className="font-semibold text-slate-900">{customer.name}</p>
                <p className="text-slate-600">
                  {customer.phone} · {customer.vehicleNumber}
                </p>
              </button>
            ))}
            {matches.length === 0 ? <p className="text-sm text-slate-500">No matching customers.</p> : null}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-md">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Customer Result</h2>
          {selected ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-semibold">Customer:</span> {selected.name}</p>
              <p><span className="font-semibold">Vehicle:</span> {selected.vehicleNumber} ({selected.vehicleType})</p>
              <p><span className="font-semibold">Previous purchases:</span> {selected.totalPurchases}</p>
              <p><span className="font-semibold">Last visit:</span> {toDisplayDate(selected.lastVisit)}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a customer from search results.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-md">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Sales Items</h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <select
              value={line.partId}
              onChange={(e) => setLine((prev) => ({ ...prev, partId: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            >
              {PARTS_CATALOG.map((p: PartOption) => (
                <option key={p.id} value={p.id}>
                  {p.name} - Rs {p.price.toLocaleString()}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(e) => setLine((prev) => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
            <button
              type="button"
              onClick={addLine}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            {lines.length} item(s) added.
          </div>
        </div>

        <Invoice customerName={selected?.name ?? ''} lines={invoiceLines} />
      </section>

      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            if (!selected || lines.length === 0) return
            onRecordSale(selected.id, lines.length)
            setLines([])
            setMessage('Invoice generated successfully.')
          }}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Generate Invoice
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Clear
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <Search className="mt-0.5 h-4 w-4 text-slate-400" />
        Discount is automatically applied on invoices above Rs 5,000 (Feature 16).
      </div>
    </div>
  )
}
