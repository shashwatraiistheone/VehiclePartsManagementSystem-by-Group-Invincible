import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { fetchParts, type InventoryPart } from '../../services/partsApi'
import {
  createPurchase,
  fetchPurchases,
  type CreatePurchaseLine,
  type PurchaseInvoice,
} from '../../services/purchaseApi'
import { fetchVendors, type Vendor } from '../../services/vendorApi'
import { formatRs } from '../../utils/formatUsd'

type LineDraft = CreatePurchaseLine & { key: string }

type Props = {
  onBack?: () => void
}

const currency = formatRs

function newLine(): LineDraft {
  return { key: crypto.randomUUID(), partId: 0, quantity: 1, costPrice: 0 }
}

export function AdminPurchasePage({ onBack }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [parts, setParts] = useState<InventoryPart[]>([])
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([])
  const [vendorId, setVendorId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState<LineDraft[]>([newLine()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null)

  const partsById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts])

  const lineTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.costPrice || 0), 0),
    [lines],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [vendorRows, partRows, purchaseRows] = await Promise.all([
        fetchVendors(),
        fetchParts(),
        fetchPurchases(),
      ])
      setVendors(vendorRows)
      setParts(partRows.filter((p) => p.isActive))
      setPurchases(purchaseRows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function updateLine(key: string, patch: Partial<LineDraft>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const next = { ...l, ...patch }
        if (patch.partId != null && patch.partId > 0) {
          const part = partsById.get(patch.partId)
          if (part && (!next.costPrice || next.costPrice <= 0)) {
            const suggested = part.costPrice > 0 ? part.costPrice : part.price
            if (suggested > 0) next.costPrice = suggested
          }
        }
        return next
      }),
    )
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()])
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const vid = Number(vendorId)
      if (!vid) throw new Error('Select a vendor.')

      const items = lines
        .filter((l) => l.partId > 0 && l.quantity > 0)
        .map(({ partId, quantity, costPrice }) => ({
          partId,
          quantity: Math.max(1, Math.floor(quantity)),
          costPrice: Number(costPrice),
        }))

      if (items.length === 0) throw new Error('Add at least one line item with a part selected.')

      const invalid = items.find((i) => i.costPrice <= 0)
      if (invalid) {
        throw new Error('Each line must have a cost price greater than $0.00.')
      }

      const created = await createPurchase({
        vendorId: vid,
        purchaseDate: purchaseDate ? `${purchaseDate}T12:00:00Z` : undefined,
        items,
      })

      setSuccess(`Purchase invoice #${created.id} created. Stock updated.`)
      setLines([newLine()])
      setVendorId('')
      setPurchaseDate(new Date().toISOString().slice(0, 10))
      const refreshed = await fetchPurchases()
      setPurchases(refreshed)
      setSelectedInvoice(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      ) : null}

      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase stock</h1>
        <p className="mt-1 text-sm text-slate-600">
          Record vendor purchases, increase inventory, and generate purchase invoices.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShoppingCart className="h-4 w-4" />
              New purchase
            </h2>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Vendor</span>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Purchase date</span>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300"
              />
            </label>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Line items</p>
              {lines.map((line) => (
                <div key={line.key} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
                  <select
                    value={line.partId || ''}
                    onChange={(e) => updateLine(line.key, { partId: Number(e.target.value) })}
                    className="rounded-lg border border-slate-300 px-2 py-2 text-sm sm:col-span-2"
                    required
                  >
                    <option value="">Part…</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.partNumber}) — stock: {p.quantity}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 1 })}
                    placeholder="Qty"
                    className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    required
                  />
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={line.costPrice > 0 ? line.costPrice : ''}
                      onChange={(e) =>
                        updateLine(line.key, { costPrice: Number(e.target.value) || 0 })
                      }
                      placeholder="Cost $"
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addLine}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add line
              </button>
            </div>

            <p className="text-right text-sm font-semibold text-slate-800">
              Total: {currency(lineTotal)}
              {lineTotal <= 0 ? (
                <span className="mt-1 block text-xs font-normal text-amber-600">
                  Select a part and enter a cost price to update the total.
                </span>
              ) : null}
            </p>

            <button
              type="submit"
              disabled={saving || lineTotal <= 0}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Create purchase invoice'}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Purchase history</h2>
            <div className="max-h-[28rem] space-y-2 overflow-y-auto">
              {purchases.length === 0 ? (
                <p className="text-sm text-slate-500">No purchases yet.</p>
              ) : (
                purchases.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedInvoice(p)}
                    className={[
                      'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
                      selectedInvoice?.id === p.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <p className="font-medium text-slate-900">
                      #{p.id} · {p.vendorName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.purchaseDate
                        ? new Date(p.purchaseDate).toLocaleDateString()
                        : '—'}{' '}
                      · {currency(p.totalAmount)}
                    </p>
                  </button>
                ))
              )}
            </div>

            {selectedInvoice ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-900">Invoice #{selectedInvoice.id}</p>
                <p className="text-slate-600">Vendor: {selectedInvoice.vendorName}</p>
                <p className="text-slate-600">
                  Date:{' '}
                  {selectedInvoice.purchaseDate
                    ? new Date(selectedInvoice.purchaseDate).toLocaleString()
                    : '—'}
                </p>
                <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2">
                  {selectedInvoice.items.map((i) => (
                    <li key={`${selectedInvoice.id}-${i.partId}`} className="flex justify-between gap-2">
                      <span>
                        {i.partName || `Part #${i.partId}`} × {i.quantity}
                      </span>
                      <span>{currency(i.costPrice * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right font-semibold">{currency(selectedInvoice.totalAmount)}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
