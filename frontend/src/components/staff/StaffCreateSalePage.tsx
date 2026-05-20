import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2, Plus, ReceiptText, Trash2 } from 'lucide-react'
import type { Part } from '../../api'
import { fetchCustomerDetail, type CustomerDetail } from '../../services/customerApi'
import { fetchCustomerLoyalty, type CustomerLoyalty } from '../../services/loyaltyApi'
import { fetchParts } from '../../services/partsApi'
import { createSale, type SaleRecord } from '../../services/salesApi'
import { staffPath } from '../../staff/staffRoutes'
import { useToast } from '../ui/ToastProvider'
import { formatRs } from '../../utils/formatUsd'

const LOYALTY_THRESHOLD = 5000
const LOYALTY_RATE = 0.1

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'

type PaymentStatus = 'Paid' | 'Credit'

type InvoiceRow = {
  key: string
  partId: number | ''
  quantity: number
}

function newRow(): InvoiceRow {
  return { key: crypto.randomUUID(), partId: '', quantity: 1 }
}

export function StaffCreateSalePage() {
  const { customerId: idParam } = useParams<{ customerId: string }>()
  const customerId = Number(idParam)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null)
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<InvoiceRow[]>([newRow()])
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Credit')
  const [submitting, setSubmitting] = useState(false)
  const [lastSale, setLastSale] = useState<SaleRecord | null>(null)

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  )

  useEffect(() => {
    if (!Number.isFinite(customerId) || customerId <= 0) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setCustomer(null)
    setLoyalty(null)
    setParts([])
    setLastSale(null)

    void (async () => {
      try {
        const detail = await fetchCustomerDetail(customerId)
        if (cancelled) return
        setCustomer(detail)

        const [loyaltyResult, inventoryParts] = await Promise.all([
          fetchCustomerLoyalty(customerId).catch(() => null),
          fetchParts().catch(() => []),
        ])
        if (cancelled) return

        setLoyalty(loyaltyResult)
        setParts(
          inventoryParts
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
            ),
        )

        if (inventoryParts.length === 0) {
          showToast('No active parts in inventory. Add stock before creating a sale.', 'error')
        }
      } catch (err) {
        if (cancelled) return
        showToast(err instanceof Error ? err.message : 'Failed to load customer', 'error')
        navigate(staffPath('search-sale'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [customerId, navigate, showToast])

  const lineDetails = useMemo(() => {
    return rows.map((row) => {
      const part = typeof row.partId === 'number' ? parts.find((p) => p.id === row.partId) : null
      const unitPrice = part?.price ?? 0
      const lineTotal = unitPrice * row.quantity
      return { row, part, unitPrice, lineTotal }
    })
  }, [rows, parts])

  const subtotal = lineDetails.reduce((s, l) => s + l.lineTotal, 0)
  const discount =
    subtotal >= LOYALTY_THRESHOLD ? Math.round(subtotal * LOYALTY_RATE * 100) / 100 : 0
  const grandTotal = subtotal - discount

  const updateRow = useCallback((key: string, patch: Partial<InvoiceRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }, [])

  function addRow() {
    setRows((prev) => [...prev, newRow()])
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)))
  }

  async function handleProcessSale() {
    const items = rows
      .filter((r) => typeof r.partId === 'number' && r.quantity > 0)
      .map((r) => ({ partId: r.partId as number, quantity: r.quantity }))

    if (items.length === 0) {
      showToast('Add at least one part with a valid quantity.', 'error')
      return
    }

    for (const { part } of lineDetails) {
      if (!part) continue
      const qtyInForm = items
        .filter((i) => i.partId === part.id)
        .reduce((s, i) => s + i.quantity, 0)
      if (qtyInForm > part.quantity) {
        showToast(`Insufficient stock for ${part.name}. Available: ${part.quantity}`, 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      const sale = await createSale({
        customerId,
        items,
        paymentStatus,
      })
      setLastSale(sale)
      showToast(
        discount > 0
          ? `Sale processed. Loyalty discount applied. Invoice ${sale.invoiceNumber}.`
          : `Sale processed. Invoice ${sale.invoiceNumber}.`,
        'success',
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to process sale', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading invoice…</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
        Invalid customer.{' '}
        <button type="button" className="underline" onClick={() => navigate(staffPath('search-sale'))}>
          Back to search
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Sales Invoice</h1>
          <p className="mt-1 text-sm text-slate-500">Create a sale for {customer.name}</p>
        </div>
        <p className="text-sm font-medium text-slate-600">{todayLabel}</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <ReceiptText className="h-5 w-5" />
            <h2 className="font-bold">Sales invoice</h2>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </span>
              <input
                readOnly
                value={`${customer.name} · ${customer.phone} · ${customer.email}`}
                className={`${INPUT_CLASS} mt-1.5 bg-slate-50`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment status
              </span>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className={`${INPUT_CLASS} mt-1.5`}
              >
                <option value="Paid">Paid</option>
                <option value="Credit">Credit</option>
              </select>
            </label>
            {loyalty ? (
              <div className="flex items-end">
                <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 ring-1 ring-slate-100">
                  Loyalty tier: <span className="font-semibold">{loyalty.tier}</span>
                  {loyalty.isEligible ? ' · eligible for order discount' : null}
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Part items</h3>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add row
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <th className="px-3 py-2.5">Part / item</th>
                    <th className="px-3 py-2.5 w-28">Unit price</th>
                    <th className="px-3 py-2.5 w-24">Qty</th>
                    <th className="px-3 py-2.5 w-28 text-right">Total</th>
                    <th className="w-12 px-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineDetails.map(({ row, part, unitPrice, lineTotal }) => (
                    <tr key={row.key}>
                      <td className="px-3 py-2">
                        <select
                          value={row.partId}
                          onChange={(e) =>
                            updateRow(row.key, {
                              partId: e.target.value ? Number(e.target.value) : '',
                            })
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="">Select part…</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                              {p.name} (stock: {p.quantity})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-slate-600">
                        {part ? formatRs(unitPrice) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          max={part?.quantity ?? 999}
                          value={row.quantity}
                          onChange={(e) =>
                            updateRow(row.key, {
                              quantity: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className={INPUT_CLASS}
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {formatRs(lineTotal)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(row.key)}
                          disabled={rows.length <= 1}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
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
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatRs(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Loyalty discount (10%)</span>
                <span className={discount > 0 ? 'font-semibold text-emerald-700' : 'tabular-nums'}>
                  {discount > 0 ? `- ${formatRs(discount)}` : '—'}
                </span>
              </div>
              {discount > 0 ? (
                <p className="text-xs font-semibold text-emerald-700">Loyalty discount applied</p>
              ) : null}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Final total amount</span>
                <span className="tabular-nums">{formatRs(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => navigate(staffPath('search-sale'))}
              className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleProcessSale()}
              disabled={submitting || !!lastSale}
              className="rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
            >
              {submitting ? 'Processing…' : 'Process Sale'}
            </button>
          </div>

          {lastSale ? (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Invoice <span className="font-semibold">{lastSale.invoiceNumber}</span> created.{' '}
              <Link
                to={`/invoice/print/${lastSale.id}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline"
              >
                Print invoice
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
