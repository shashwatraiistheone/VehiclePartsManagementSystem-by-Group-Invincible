import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { History, Loader2, X } from 'lucide-react'
import {
  fetchCustomerDetail,
  fetchCustomerHistory,
  type CustomerDetail,
  type PurchaseHistoryRecord,
  type PagedResult,
  type ServiceHistoryRecord,
  type Vehicle,
} from '../../../services/customerApi'
import { fetchCustomerLoyaltyPanel, type CustomerLoyalty } from '../../../services/loyaltyApi'
import { formatRs } from '../../../utils/formatUsd'

const PAGE_SIZE = 5

type Props = {
  customerId: number
  customerName: string
  onClose: () => void
}

function paginateClient<T>(items: T[], page: number, pageSize: number): PagedResult<T> {
  const totalCount = items.length
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)
  const safePage = Math.min(Math.max(1, page), Math.max(1, totalPages))
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  }
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
  if (t.includes('GOLD')) return 'bg-amber-100 text-amber-900 ring-amber-300/60'
  if (t === 'SILVER') return 'bg-slate-200 text-slate-800 ring-slate-300/60'
  if (t === 'BRONZE' || t === 'MEMBER') return 'bg-orange-100 text-orange-900 ring-orange-300/60'
  return 'bg-blue-50 text-blue-800 ring-blue-200/60'
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

export function StaffCustomerHistoryDrawer({ customerId, customerName, onClose }: Props) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allPurchases, setAllPurchases] = useState<PurchaseHistoryRecord[]>([])
  const [allServices, setAllServices] = useState<ServiceHistoryRecord[]>([])
  const [purchasePage, setPurchasePage] = useState(1)
  const [servicePage, setServicePage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const loadCore = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [history, loyaltyResult, detailResult] = await Promise.all([
        fetchCustomerHistory(customerId),
        fetchCustomerLoyaltyPanel(customerId).catch(() => null),
        fetchCustomerDetail(customerId).catch(() => null),
      ])

      const d: CustomerDetail =
        detailResult ??
        ({
          id: customerId,
          name: history.customerName || customerName,
          email: history.customerEmail ?? '',
          phone: '',
          address: '',
          vehicles: [],
          totalPurchases: history.purchases?.length ?? 0,
          totalSpent: loyaltyResult?.totalSpent ?? 0,
          lastPurchaseDate: history.purchases[0]?.date ?? null,
          pendingCredits: [],
        } satisfies CustomerDetail)

      setDetail(d)
      setLoyalty(loyaltyResult)
      setVehicles(d.vehicles ?? [])
      setAllPurchases(history.purchases ?? [])
      setAllServices(history.services ?? [])
      setPurchasePage(1)
      setServicePage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer history')
    } finally {
      setLoading(false)
    }
  }, [customerId, customerName])

  useEffect(() => {
    void loadCore()
  }, [loadCore])

  const purchases = useMemo(
    () => paginateClient(allPurchases, purchasePage, PAGE_SIZE),
    [allPurchases, purchasePage],
  )

  const services = useMemo(
    () => paginateClient(allServices, servicePage, PAGE_SIZE),
    [allServices, servicePage],
  )

  const appointmentBuckets = useMemo(() => {
    const buckets: {
      upcoming: ServiceHistoryRecord[]
      completed: ServiceHistoryRecord[]
      cancelled: ServiceHistoryRecord[]
    } = { upcoming: [], completed: [], cancelled: [] }
    allServices.forEach((a) => {
      buckets[appointmentBucket(a.status)].push(a)
    })
    return buckets
  }, [allServices])

  const displayName = detail?.name ?? customerName
  const totalSpent = detail?.totalSpent ?? loyalty?.totalSpent ?? 0
  const tier = loyalty?.tier ?? 'MEMBER'
  const lastPurchase = detail?.lastPurchaseDate ?? allPurchases[0]?.date ?? null

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-history-drawer-title"
    >
      <button
        type="button"
        aria-label="Close panel"
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative flex h-full w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out md:mx-auto md:my-6 md:h-[calc(100%-3rem)] md:max-h-[720px] md:max-w-lg md:rounded-2xl md:border md:border-slate-200 lg:my-0 lg:h-full lg:max-h-none lg:max-w-xl lg:rounded-none lg:border-0 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <History className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
                  Customer history
                </p>
              </div>
              <h2 id="customer-history-drawer-title" className="truncate text-lg font-bold">
                {displayName}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${loyaltyBadgeClass(tier)}`}
                >
                  {displayTier(tier)}
                </span>
                <span className="text-sm text-blue-100">
                  {formatRs(totalSpent)} spent · {vehicles.length} vehicle
                  {vehicles.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Loading customer history…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => void loadCore()}
                className="mt-2 text-sm font-semibold text-rose-900 underline"
              >
                Retry
              </button>
            </div>
          ) : detail ? (
            <div className="space-y-6">
              <Section title="Loyalty information">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat
                    label="Loyalty points"
                    value={`${(loyalty?.loyaltyPoints ?? 0).toLocaleString()} PTS`}
                  />
                  <Stat label="Tier level" value={displayTier(loyalty?.tier ?? tier)} />
                  <Stat label="Total spent" value={formatRs(totalSpent)} />
                  <Stat
                    label="Last purchase"
                    value={lastPurchase ? formatDate(lastPurchase) : '—'}
                  />
                </div>
              </Section>

              <Section title="Purchase history">
                {purchases.items.length > 0 ? (
                  <ul className="space-y-3">
                    {purchases.items.map((p) => (
                      <li
                        key={p.saleId}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {p.invoiceNumber ?? `SALE-${p.saleId}`}
                            </p>
                            <p className="text-xs text-slate-500">{formatDate(p.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold tabular-nums text-slate-900">
                              {formatRs(p.finalAmount)}
                            </p>
                            <p className="text-xs font-medium text-blue-600">
                              {p.paymentStatus ?? 'Credit'}
                            </p>
                          </div>
                        </div>
                        {p.items.length > 0 ? (
                          <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                            {p.items.map((item) => (
                              <li key={`${p.saleId}-${item.partId}`}>
                                {item.quantity}× {item.partName} — {formatRs(item.price * item.quantity)}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState message="No purchases on record." />
                )}
                {purchases.totalPages > 1 ? (
                  <Pager
                    page={purchasePage}
                    totalPages={purchases.totalPages}
                    onPage={setPurchasePage}
                  />
                ) : null}
              </Section>

              <Section title="Service history">
                {services.items.length > 0 ? (
                  <ul className="space-y-3">
                    {services.items.map((s) => (
                      <li
                        key={s.appointmentId}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <p className="font-semibold text-slate-900">{s.serviceType}</p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                            {s.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(s.date)} · {s.vehicleNumber ?? 'No vehicle'} ·{' '}
                          {s.assignedStaff ?? '—'}
                        </p>
                        {s.notes ? (
                          <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                            {s.notes}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState message="No service appointments on record." />
                )}
                {services.totalPages > 1 ? (
                  <Pager page={servicePage} totalPages={services.totalPages} onPage={setServicePage} />
                ) : null}
              </Section>

              <Section title="Appointment history">
                <div className="grid gap-3 sm:grid-cols-3">
                  <AppointmentBucket title="Upcoming" items={appointmentBuckets.upcoming} />
                  <AppointmentBucket title="Completed" items={appointmentBuckets.completed} />
                  <AppointmentBucket title="Cancelled" items={appointmentBuckets.cancelled} />
                </div>
              </Section>

              <Section title="Vehicle history">
                {vehicles.length === 0 ? (
                  <EmptyState message="No vehicles registered." />
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="bg-blue-50 text-[10px] font-bold uppercase tracking-wider text-blue-800">
                          <th className="px-3 py-2.5">Vehicle</th>
                          <th className="px-3 py-2.5">Mileage</th>
                          <th className="px-3 py-2.5">Last service</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vehicles.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/80">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-slate-900">
                                {v.year} {v.brand} {v.model}
                              </p>
                              <p className="text-xs font-semibold uppercase text-slate-500">
                                {v.vehicleNumber}
                              </p>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {v.mileage.toLocaleString()} km
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {v.lastServiceDate ? formatDate(v.lastServiceDate) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
        {title}
      </h3>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </p>
  )
}

function InlineLoader() {
  return (
    <div className="flex justify-center py-6">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  )
}

function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
      >
        Previous
      </button>
      <span className="text-xs text-slate-500">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}

function AppointmentBucket({
  title,
  items,
}: {
  title: string
  items: ServiceHistoryRecord[]
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">None</p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
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
