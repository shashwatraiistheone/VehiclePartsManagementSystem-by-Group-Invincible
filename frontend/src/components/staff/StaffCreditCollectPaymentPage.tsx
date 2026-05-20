import { useEffect, useState } from 'react'
import { ArrowLeft, Banknote, Loader2, Receipt } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchCreditInvoice,
  fetchCreditPaymentHistory,
  PAYMENT_METHODS,
  submitCreditPayment,
  type CreditInvoice,
  type CreditPaymentHistory,
  type CreditPaymentSuccessState,
} from '../../services/creditApi'
import { staffPath } from '../../staff/staffRoutes'
import { useToast } from '../ui/ToastProvider'
import { formatMoney } from '../../utils/formatUsd'

const INPUT_CLASS =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function displayStatus(status: string) {
  const s = status.toUpperCase()
  if (s === 'PAID' || s.includes('PAID')) return 'PAID'
  if (s === 'PARTIAL' || s.includes('PARTIAL')) return 'PARTIAL'
  return 'UNPAID'
}

export function StaffCreditCollectPaymentPage() {
  const { invoiceId: idParam } = useParams<{ invoiceId: string }>()
  const invoiceId = Number(idParam)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [invoice, setInvoice] = useState<CreditInvoice | null>(null)
  const [history, setHistory] = useState<CreditPaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0])
  const [notes, setNotes] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) {
      setLoading(false)
      setError('Invalid invoice.')
      return
    }

    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const [inv, hist] = await Promise.all([
          fetchCreditInvoice(invoiceId),
          fetchCreditPaymentHistory(invoiceId),
        ])
        if (cancelled) return
        setInvoice(inv)
        setHistory(hist)
        setAmount(String(inv.balanceDue))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load invoice')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [invoiceId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoice) return

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setFieldError('Payment amount must be greater than zero.')
      return
    }
    if (value > invoice.balanceDue) {
      setFieldError(`Amount cannot exceed remaining balance of ${formatMoney(invoice.balanceDue)}.`)
      return
    }

    setSubmitting(true)
    setFieldError(null)
    try {
      const res = await submitCreditPayment({
        invoiceId: invoice.id,
        amount: value,
        paymentMethod: method,
        notes: notes.trim() || undefined,
      })

      const paymentSuccess: CreditPaymentSuccessState = {
        paidAmount: res.paidAmount,
        remainingBalance: res.remainingBalance,
        status: res.status,
        totalReceivables: res.totalReceivables,
        invoice: res.invoice,
      }

      navigate(staffPath('credit-management'), { state: { paymentSuccess } })
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Payment failed', 'error')
      setFieldError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Loading payment details…</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <p className="text-sm font-semibold text-rose-700">{error ?? 'Invoice not found'}</p>
        <Link
          to={staffPath('credit-management')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Credits
        </Link>
      </div>
    )
  }

  const settled = invoice.balanceDue <= 0

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl flex-col justify-center px-2 py-8 sm:px-0">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-100">
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-4 text-white sm:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                <Banknote className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-bold tracking-tight">Record Payment</span>
            </div>
            <p className="truncate text-center text-sm font-semibold text-white/95">
              {invoice.customerName}
            </p>
            <p className="text-right text-xs font-bold text-slate-300 sm:text-sm">
              #{invoice.invoiceNumber}
            </p>
          </div>
        </div>

        {settled ? (
          <div className="space-y-4 p-6 text-center">
            <p className="text-sm text-slate-600">This invoice is fully paid.</p>
            <Link
              to={staffPath('credit-management')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Credits
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 p-6">
            <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-6 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600/90">
                Remaining Balance Due
              </p>
              <p className="mt-2 text-4xl font-extrabold tabular-nums tracking-tight text-rose-700">
                {formatMoney(invoice.balanceDue)}
              </p>
              <p className="mt-1 text-xs text-rose-600/80">
                of {formatMoney(invoice.originalAmount)} invoice total
              </p>
            </div>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment Amount Collected
              </span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min={0.01}
                  max={invoice.balanceDue}
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setFieldError(null)
                  }}
                  className={`${INPUT_CLASS} pl-7`}
                />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Enter the amount received from the customer. Supports partial payments.
              </p>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment Method
              </span>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={INPUT_CLASS}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment Notes
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Installment, partial payment, transaction reference…"
                className={`${INPUT_CLASS} resize-none`}
              />
            </label>

            {fieldError ? <p className="text-sm font-medium text-rose-600">{fieldError}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Payment
            </button>

            <Link
              to={staffPath('credit-management')}
              className="block w-full rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Back to Credits
            </Link>
          </form>
        )}

        {history.length > 0 ? (
          <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Receipt className="h-3.5 w-3.5" />
              Payment History
            </p>
            <ul className="max-h-40 space-y-2 overflow-y-auto">
              {history.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{formatMoney(p.amountPaid)}</p>
                    <p className="text-slate-500">
                      {p.paymentMethod} · {formatDateTime(p.paymentDate)}
                      {p.staffMember ? ` · ${p.staffMember}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Balance after: {formatMoney(p.remainingBalanceAfter)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold uppercase text-slate-600">
                    {displayStatus(p.status)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
