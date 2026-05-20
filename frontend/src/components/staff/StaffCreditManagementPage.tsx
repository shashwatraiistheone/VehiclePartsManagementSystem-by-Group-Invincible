import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock, CreditCard, History, Loader2, Mail, RefreshCw, Search, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchCreditInvoices,
  sendCreditReminder,
  type CreditInvoice,
  type CreditPaymentSuccessState,
} from '../../services/creditApi'
import { staffCreditCollectPath } from '../../staff/staffRoutes'
import { useToast } from '../ui/ToastProvider'
import { CreditReminderHistoryModal } from './credit/CreditReminderHistoryModal'
import { formatMoney } from '../../utils/formatUsd'

type LocationState = {
  paymentSuccess?: CreditPaymentSuccessState
}

type StatusFilter = 'all' | 'unpaid' | 'paid'
type AgeFilter = 'all' | '0-30' | '31-90' | '90+'
type SortKey = 'balance' | 'oldest'

function formatInvoiceDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isPaid(inv: CreditInvoice) {
  return inv.balanceDue <= 0 || inv.status.toLowerCase() === 'paid'
}

function isPartial(inv: CreditInvoice) {
  return !isPaid(inv) && (inv.paidAmount > 0 || inv.status.toLowerCase() === 'partial')
}

function ageBadgeClass(days: number) {
  if (days <= 0) return 'bg-slate-100 text-slate-600 ring-slate-200'
  if (days <= 30) return 'bg-amber-50 text-amber-800 ring-amber-200'
  if (days <= 90) return 'bg-orange-50 text-orange-800 ring-orange-200'
  return 'bg-rose-50 text-rose-700 ring-rose-200'
}

function formatLastReminder(iso?: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type SuccessBanner = {
  paidAmount: number
  remainingBalance: number
  fullyPaid: boolean
}

export function StaffCreditManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const [items, setItems] = useState<CreditInvoice[]>([])
  const [totalReceivables, setTotalReceivables] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unpaid')
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('balance')
  const [actionId, setActionId] = useState<number | null>(null)
  const [successBanner, setSuccessBanner] = useState<SuccessBanner | null>(null)
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const [historyInvoice, setHistoryInvoice] = useState<CreditInvoice | null>(null)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await fetchCreditInvoices()
      setItems(data.items)
      setTotalReceivables(data.totalReceivables)
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load credit invoices')
      }
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const ps = (location.state as LocationState | null)?.paymentSuccess
    if (ps) return
    void load()
  }, [load, location.state])

  useEffect(() => {
    const ps = (location.state as LocationState | null)?.paymentSuccess
    if (!ps?.invoice) return

    setSuccessBanner({
      paidAmount: ps.paidAmount,
      remainingBalance: ps.remainingBalance,
      fullyPaid: ps.remainingBalance <= 0,
    })
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === ps.invoice.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = ps.invoice
        return next
      }
      return [ps.invoice, ...prev]
    })
    setTotalReceivables(ps.totalReceivables)
    setHighlightId(ps.invoice.id)
    setLoading(false)
    setError(null)
    navigate(location.pathname, { replace: true, state: null })
    void load({ silent: true })

    const timer = window.setTimeout(() => setHighlightId(null), 2500)
    return () => window.clearTimeout(timer)
  }, [location.state, location.pathname, navigate, load])

  useEffect(() => {
    if (!successBanner) return
    const timer = window.setTimeout(() => setSuccessBanner(null), 10000)
    return () => window.clearTimeout(timer)
  }, [successBanner])

  const filtered = useMemo(() => {
    let list = [...items]

    if (statusFilter === 'unpaid') list = list.filter((i) => !isPaid(i))
    if (statusFilter === 'paid') list = list.filter((i) => isPaid(i))

    if (ageFilter === '0-30') list = list.filter((i) => i.overdueDays > 0 && i.overdueDays <= 30)
    if (ageFilter === '31-90') list = list.filter((i) => i.overdueDays >= 31 && i.overdueDays <= 90)
    if (ageFilter === '90+') list = list.filter((i) => i.overdueDays > 90)

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.customerName.toLowerCase().includes(q) ||
          i.customerEmail.toLowerCase().includes(q),
      )
    }

    if (sortKey === 'balance') {
      list.sort((a, b) => b.balanceDue - a.balanceDue)
    } else {
      list.sort((a, b) => b.overdueDays - a.overdueDays)
    }

    return list
  }, [items, statusFilter, ageFilter, search, sortKey])

  async function handleRemind(inv: CreditInvoice) {
    setActionId(inv.id)
    try {
      const msg = await sendCreditReminder(inv.id)
      showToast(msg, 'success')
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Reminder failed', 'error')
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-6">
      {successBanner ? (
        <div
          role="status"
          className="animate-in fade-in slide-in-from-top-2 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900 shadow-sm duration-300"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <p className="flex-1 font-medium leading-relaxed">
            {successBanner.fullyPaid ? (
              <>
                Payment of <span className="font-bold">{formatMoney(successBanner.paidAmount)}</span>{' '}
                recorded. Invoice paid in full.
              </>
            ) : (
              <>
                Payment of <span className="font-bold">{formatMoney(successBanner.paidAmount)}</span>{' '}
                recorded. Remaining balance:{' '}
                <span className="font-bold tabular-nums">
                  {formatMoney(successBanner.remainingBalance)}
                </span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="shrink-0 rounded-lg p-1 text-emerald-700 transition hover:bg-emerald-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Credit Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage outstanding customer balances
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white px-5 py-4 shadow-sm ring-1 ring-blue-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Total Receivables
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-blue-900">
            {formatMoney(totalReceivables)}
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900">
        <p className="font-semibold">Payment reminder emails</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-blue-800/90">
          <li>
            <strong>Remind</strong> — send manual email with amount left to pay (any unpaid invoice).
          </li>
          <li>
            <strong>Automatic</strong> — overdue emails when balance is 30+ days past due (runs daily).
          </li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or customer…"
            className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="all">All</option>
          </select>
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value as AgeFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">All ages</option>
            <option value="0-30">0–30 days</option>
            <option value="31-90">31–90 days</option>
            <option value="90+">90+ days</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="balance">Highest balance</option>
            <option value="oldest">Oldest overdue</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading credit ledger…</p>
          </div>
        ) : error ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-500">No invoices match your filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Invoice &amp; Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Balance Due</th>
                  <th className="px-4 py-3.5">Age</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const paid = isPaid(inv)
                  const partial = isPartial(inv)
                  const busy = actionId === inv.id
                  const highlighted = highlightId === inv.id
                  return (
                    <tr
                      key={inv.id}
                      className={`transition hover:bg-slate-50/80 ${
                        highlighted ? 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-200' : ''
                      }`}
                    >
                      <td className="px-5 py-4 align-top">
                        <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatInvoiceDate(inv.invoiceDate)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-slate-900">{inv.customerName}</p>
                        <p className="text-xs text-slate-500">{inv.customerEmail}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-bold tabular-nums text-slate-900">
                          {formatMoney(inv.balanceDue)}
                        </p>
                        <p className="text-xs text-slate-500">
                          of {formatMoney(inv.originalAmount)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {paid ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-200">
                            Paid
                          </span>
                        ) : partial ? (
                          <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase text-sky-800 ring-1 ring-sky-200">
                            Partial
                          </span>
                        ) : (
                          <>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
                                inv.overdueDays > 30
                                  ? 'bg-rose-100 text-rose-800 ring-rose-300'
                                  : ageBadgeClass(inv.overdueDays)
                              }`}
                            >
                              {inv.overdueDays > 30 ? 'OVERDUE · ' : ''}
                              {inv.overdueDays} {inv.overdueDays === 1 ? 'DAY' : 'DAYS'}
                            </span>
                            {inv.reminderSentCount > 0 ? (
                              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 ring-1 ring-blue-200">
                                <Mail className="h-3 w-3" />
                                Reminder sent
                              </span>
                            ) : null}
                            {formatLastReminder(inv.lastReminderDate) ? (
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                <Clock className="h-3 w-3" />
                                Last: {formatLastReminder(inv.lastReminderDate)}
                              </p>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center justify-end gap-2">
                          {!paid ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setHistoryInvoice(inv)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                title="Reminder history"
                                aria-label="Reminder history"
                              >
                                <History className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleRemind(inv)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                              >
                                {busy ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Mail className="h-3.5 w-3.5" />
                                )}
                                Remind
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => navigate(staffCreditCollectPath(inv.id))}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                Pay
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Settled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {historyInvoice ? (
        <CreditReminderHistoryModal
          invoiceId={historyInvoice.id}
          invoiceNumber={historyInvoice.invoiceNumber}
          customerName={historyInvoice.customerName}
          onClose={() => setHistoryInvoice(null)}
        />
      ) : null}
    </div>
  )
}
