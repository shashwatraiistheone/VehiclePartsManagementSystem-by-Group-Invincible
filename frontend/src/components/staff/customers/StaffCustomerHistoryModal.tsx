import { useEffect, useMemo, useState } from 'react'
import { Eye, Loader2, X } from 'lucide-react'
import {
  fetchCustomerDetail,
  fetchCustomerHistory,
  type CustomerDetail,
  type CustomerHistory,
  type Vehicle,
} from '../../../services/customerApi'
import { fetchCustomerLoyalty, type CustomerLoyalty } from '../../../services/loyaltyApi'
import { formatRs } from '../../../utils/formatUsd'

type Props = {
  customerId: number
  customerName: string
  onClose: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function loyaltyBadgeClass(tier: string) {
  const t = tier.toUpperCase()
  if (t.includes('GOLD')) return 'bg-amber-100 text-amber-900'
  if (t === 'SILVER') return 'bg-slate-200 text-slate-800'
  if (t === 'BRONZE' || t === 'MEMBER') return 'bg-orange-100 text-orange-900'
  return 'bg-blue-100 text-blue-800'
}

function displayTier(tier: string) {
  const t = tier.toUpperCase()
  if (t === 'MEMBER') return 'BRONZE'
  return t.replace(' PLUS', '+')
}

function appointmentBucket(status: string): 'upcoming' | 'completed' | 'cancelled' {
  const s = status.toLowerCase()
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('complete') || s.includes('done') || s.includes('fulfil')) return 'completed'
  return 'upcoming'
}

export function StaffCustomerHistoryModal({ customerId, customerName, onClose }: Props) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [history, setHistory] = useState<CustomerHistory | null>(null)
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [d, h, l] = await Promise.all([
          fetchCustomerDetail(customerId),
          fetchCustomerHistory(customerId),
          fetchCustomerLoyalty(customerId).catch(() => null),
        ])
        if (!cancelled) {
          setDetail(d)
          setHistory(h)
          setLoyalty(l)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [customerId])

  const appointments = useMemo(() => {
    if (!history) return { upcoming: [], completed: [], cancelled: [] }
    const buckets: {
      upcoming: CustomerHistory['services']
      completed: CustomerHistory['services']
      cancelled: CustomerHistory['services']
    } = { upcoming: [], completed: [], cancelled: [] }
    history.services.forEach((s) => {
      buckets[appointmentBucket(s.status)].push(s)
    })
    return buckets
  }, [history])

  const vehicles: Vehicle[] = detail?.vehicles ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-history-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in duration-200">
        <div className="flex shrink-0 items-start justify-between gap-3 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Eye className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="customer-history-title" className="text-lg font-bold">
                Customer History
              </h2>
              <p className="text-sm text-blue-100">{customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Loading customer history…</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          ) : detail && history ? (
            <div className="space-y-8">
              <section className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</p>
                  <p className="mt-1 font-semibold text-slate-900">{detail.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</p>
                  <p className="mt-1 text-sm text-slate-700">{detail.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                  <p className="mt-1 text-sm text-slate-700">{detail.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Loyalty tier
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${loyaltyBadgeClass(loyalty?.tier ?? 'MEMBER')}`}
                  >
                    {displayTier(loyalty?.tier ?? 'MEMBER')}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Total spent
                  </p>
                  <p className="mt-1 font-semibold tabular-nums text-slate-900">
                    {formatRs(detail.totalSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Loyalty points
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {(loyalty?.loyaltyPoints ?? 0).toLocaleString()} PTS
                  </p>
                </div>
              </section>

              <HistoryTable
                title="Purchase history"
                headers={['Invoice', 'Date', 'Amount', 'Status']}
                empty="No purchases on record."
                rows={history.purchases.map((p) => [
                  p.invoiceNumber ?? `SALE-${p.saleId}`,
                  formatDate(p.date),
                  formatRs(p.finalAmount),
                  p.paymentStatus ?? (p.finalAmount <= 0 ? '—' : 'Credit'),
                ])}
              />

              <HistoryTable
                title="Service history"
                headers={['Service type', 'Appointment date', 'Vehicle', 'Status']}
                empty="No service appointments on record."
                rows={history.services.map((s) => [
                  s.serviceType,
                  formatDate(s.date),
                  s.vehicleNumber ?? '—',
                  s.status,
                ])}
              />

              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">Appointment history</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <AppointmentBucket title="Upcoming" items={appointments.upcoming} />
                  <AppointmentBucket title="Completed" items={appointments.completed} />
                  <AppointmentBucket title="Cancelled" items={appointments.cancelled} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold text-slate-900">Registered vehicles</h3>
                {vehicles.length === 0 ? (
                  <p className="text-sm text-slate-500">No vehicles registered.</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                          <th className="px-4 py-2.5">Make</th>
                          <th className="px-4 py-2.5">Model</th>
                          <th className="px-4 py-2.5">Year</th>
                          <th className="px-4 py-2.5">License plate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicles.map((v) => (
                          <tr key={v.id}>
                            <td className="px-4 py-2.5">{v.brand}</td>
                            <td className="px-4 py-2.5">{v.model}</td>
                            <td className="px-4 py-2.5">{v.year}</td>
                            <td className="px-4 py-2.5 font-semibold uppercase">{v.vehicleNumber}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function HistoryTable({
  title,
  headers,
  rows,
  empty,
}: {
  title: string
  headers: string[]
  rows: string[][]
  empty: string
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-slate-900">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AppointmentBucket({
  title,
  items,
}: {
  title: string
  items: CustomerHistory['services']
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">None</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((a) => (
            <li key={a.appointmentId} className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs">
              <p className="font-medium text-slate-800">{a.serviceType}</p>
              <p className="text-slate-500">{formatDate(a.date)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
