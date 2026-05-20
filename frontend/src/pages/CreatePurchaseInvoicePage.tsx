import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { useToast } from '../components/ui/ToastProvider'
import { createPurchase } from '../services/purchaseApi'
import { fetchParts, type InventoryPart } from '../services/partsApi'
import { fetchVendors, type Vendor } from '../services/vendorApi'
import { formatUsd } from '../utils/formatUsd'

type ItemRow = {
  key: string
  partId: string
  quantity: string
  unitPrice: string
}

type Props = {
  onCancel: () => void
  onSuccess: () => void
}

function todayIsoDate(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function newRow(): ItemRow {
  return { key: crypto.randomUUID(), partId: '', quantity: '1', unitPrice: '' }
}

export default function CreatePurchaseInvoicePage({ onCancel, onSuccess }: Props) {
  const { showToast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [parts, setParts] = useState<InventoryPart[]>([])
  const [vendorId, setVendorId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayIsoDate)
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<ItemRow[]>([newRow()])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchVendors(), fetchParts()])
      .then(([v, p]) => {
        setVendors(v)
        setParts(p.filter((x) => x.isActive))
      })
      .catch(() => {
        setVendors([])
        setParts([])
      })
      .finally(() => setLoading(false))
  }, [])

  const vendorOptions = useMemo(
    () => vendors.map((v) => ({ value: String(v.id), label: v.name })),
    [vendors],
  )

  const vendorParts = useMemo(() => {
    if (!vendorId) return []
    const vid = Number(vendorId)
    return parts.filter((p) => p.vendorId === vid || p.vendorId == null)
  }, [parts, vendorId])

  const partOptions = useMemo(
    () => vendorParts.map((p) => ({ value: String(p.id), label: `${p.partNumber} — ${p.name}` })),
    [vendorParts],
  )

  const rowTotals = useMemo(
    () =>
      rows.map((r) => {
        const qty = Number(r.quantity)
        const price = Number(r.unitPrice)
        if (!Number.isFinite(qty) || !Number.isFinite(price) || qty <= 0 || price <= 0) return 0
        return qty * price
      }),
    [rows],
  )

  const invoiceTotal = rowTotals.reduce((sum, n) => sum + n, 0)

  function updateRow(key: string, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function onPartSelect(key: string, partId: string) {
    const part = vendorParts.find((p) => String(p.id) === partId)
    updateRow(key, {
      partId,
      unitPrice: part && part.costPrice > 0 ? String(part.costPrice) : '',
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vendorId) {
      showToast('Please select a vendor.', 'error')
      return
    }

    const lines = rows
      .map((r) => ({
        partId: Number(r.partId),
        quantity: Number(r.quantity),
        costPrice: Number(r.unitPrice),
      }))
      .filter((l) => l.partId > 0 && l.quantity > 0 && l.costPrice > 0)

    if (lines.length === 0) {
      showToast('Add at least one valid purchase item.', 'error')
      return
    }

    setSubmitting(true)
    try {
      await createPurchase({
        vendorId: Number(vendorId),
        purchaseDate: new Date(purchaseDate).toISOString(),
        notes: notes.trim() || undefined,
        items: lines,
      })
      showToast('Purchase invoice posted and inventory updated.', 'success')
      onSuccess()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save invoice', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-full space-y-6 bg-slate-100/80">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Record New Purchase Invoice
        </h1>
        <p className="mt-1 text-slate-600">
          Recording a purchase invoice automatically adds the items to your stock inventory.
        </p>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Invoice Details
              </h2>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Vendor</label>
                <SearchableSelect
                  label="Vendor"
                  value={vendorId}
                  onChange={setVendorId}
                  options={vendorOptions}
                  placeholder="Select vendor"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Optional notes regarding this shipment."
                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            </div>
          </section>

          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Invoice Value
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 tabular-nums">
              {formatUsd(invoiceTotal)}
            </p>
          </div>
        </div>

        <div className="lg:col-span-8">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
                Purchase Items
              </h2>
              <button
                type="button"
                disabled={!vendorId}
                onClick={() => setRows((r) => [...r, newRow()])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item Row
              </button>
            </div>

            {!vendorId ? (
              <p className="px-6 py-16 text-center text-sm text-slate-500">
                Please select a vendor on the left to begin adding parts to this invoice.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Part</th>
                      <th className="px-4 py-3 w-28">Quantity</th>
                      <th className="px-4 py-3 w-32">Unit Price</th>
                      <th className="px-4 py-3 w-32">Total</th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row.key} className="border-b border-slate-100">
                        <td className="px-4 py-3">
                          <SearchableSelect
                            label="Part"
                            value={row.partId}
                            onChange={(v) => onPartSelect(row.key, v)}
                            options={partOptions}
                            placeholder="Select Part"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={row.unitPrice}
                            onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm tabular-nums outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium tabular-nums text-slate-800">
                          {formatUsd(rowTotals[idx] ?? 0)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            disabled={rows.length <= 1}
                            onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !vendorId || invoiceTotal <= 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-green-500 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save &amp; Post Invoice
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
