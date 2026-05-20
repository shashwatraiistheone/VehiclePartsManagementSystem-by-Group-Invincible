import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDaysIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  TruckIcon,
} from 'lucide-react'
import type { CustomerNavId } from './types'
import {
  deleteVehicle,
  fetchVehicles,
  type CustomerHistory,
  type CustomerNotification,
  type Vehicle,
} from '../../services/customerApi'
import {
  cancelAppointment,
  createAppointment,
  fetchMyAppointments,
  updateAppointment,
  type Appointment as Appt,
} from '../../services/appointmentApi'
import { deletePartRequest, fetchMyPartRequests, type PartRequest } from '../../services/partRequestApi'
import { createReview, fetchMyReviews, type Review } from '../../services/reviewApi'
import type { MaintenancePrediction } from '../../services/predictionApi'
import { useToast } from '../ui/ToastProvider'
import { InvoiceModal } from './InvoiceModal'
import { AddVehicleForm } from './AddVehicleForm'
import { EmptyState, formatDate, formatMoney, SectionCard, StatusBadge } from './shared'

const SERVICE_TYPES = [
  'General service',
  'Oil change',
  'Brake inspection',
  'Diagnostics',
  'Tire rotation',
  'Battery check',
  'AC service',
] as const

export { ProfileSection } from './CustomerProfileSection'

// â€”â€”â€” Vehicles â€”â€”â€”
export function VehiclesSection({
  customerId,
  vehicles: initial,
  onChange,
  initialShowAdd = false,
}: {
  customerId: number
  vehicles: Vehicle[]
  onChange: (v: Vehicle[]) => void
  initialShowAdd?: boolean
}) {
  const { showToast } = useToast()
  const [vehicles, setVehicles] = useState(initial)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showAdd, setShowAdd] = useState(initialShowAdd)

  useEffect(() => {
    setVehicles(initial)
  }, [initial])

  useEffect(() => {
    if (initialShowAdd) {
      setShowAdd(true)
      setEditingVehicle(null)
    }
  }, [initialShowAdd])

  function handleVehiclesUpdated(updated: Vehicle[]) {
    setVehicles(updated)
    onChange(updated)
    setShowAdd(false)
    setEditingVehicle(null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Remove this vehicle from your account?')) return
    try {
      await deleteVehicle(customerId, id)
      const updated = await fetchVehicles(customerId)
      handleVehiclesUpdated(updated)
      showToast('Vehicle removed.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const showForm = showAdd || editingVehicle != null

  return (
    <div className="space-y-8">
      {!initialShowAdd ? (
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Vehicles</h1>
          <p className="mt-1 text-slate-600">Register and manage vehicles linked to your service history.</p>
        </div>
        {!showForm ? (
          <button
            type="button"
            onClick={() => {
              setShowAdd(true)
              setEditingVehicle(null)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <PlusIcon className="h-4 w-4" /> Add vehicle
          </button>
        ) : null}
      </header>
      ) : null}

      {showForm ? (
        <AddVehicleForm
          customerId={customerId}
          vehicles={vehicles}
          editingVehicle={editingVehicle}
          variant="page"
          onSuccess={handleVehiclesUpdated}
          onCancel={() => {
            setShowAdd(false)
            setEditingVehicle(null)
          }}
        />
      ) : null}

      {!showForm && vehicles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((v) => (
              <div key={v.id} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <TruckIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{v.vehicleNumber}</p>
                      <p className="text-sm text-slate-600">{v.brand} {v.model}</p>
                      <p className="mt-1 text-xs text-slate-500">{v.year} Â· {v.mileage.toLocaleString()} km</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => { setEditingVehicle(v); setShowAdd(false) }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Edit">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void handleDelete(v.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Delete">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </div>
      ) : !showForm ? (
        <EmptyState
          title="No vehicles registered"
          description="Add your vehicle to book services and receive AI maintenance suggestions."
          action={
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Register your first vehicle
            </button>
          }
        />
      ) : null}
    </div>
  )
}

// â€”â€”â€” Purchase history â€”â€”â€”
export function PurchasesSection({
  history,
  onNavigate,
}: {
  history: CustomerHistory
  onNavigate?: (navId: CustomerNavId) => void
}) {
  const [search, setSearch] = useState('')
  const [invoice, setInvoice] = useState<CustomerHistory['purchases'][number] | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return history.purchases
    return history.purchases.filter(
      (p) =>
        String(p.saleId).includes(q) ||
        p.items.some((i) => i.partName?.toLowerCase().includes(q)),
    )
  }, [history.purchases, search])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase History</h1>
          <p className="mt-1 text-slate-600">Parts purchases, invoices, and loyalty discounts applied.</p>
        </div>
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('request-part')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
          >
            <ShoppingBagIcon className="h-4 w-4" />
            Buy a part
          </button>
        ) : null}
      </header>

      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sale ID or partâ€¦" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm" />
      </div>

      {filtered.length ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Sale</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.saleId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium">#{p.saleId}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{p.items.length} item(s)</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(p.finalAmount)}</td>
                  <td className="px-4 py-3">
                    {p.discount > 0 ? (
                      <span className="text-emerald-600">âˆ’{formatMoney(p.discount)}</span>
                    ) : (
                      <span className="text-slate-400">â€”</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setInvoice(p)} className="text-xs font-semibold text-blue-600 hover:underline">
                      View invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No purchases found"
          description={search ? 'Try a different search term.' : 'Your purchase history will appear after your first order.'}
          action={
            onNavigate && !search ? (
              <button
                type="button"
                onClick={() => onNavigate('request-part')}
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800"
              >
                Buy a part
              </button>
            ) : undefined
          }
        />
      )}

      {invoice ? <InvoiceModal purchase={invoice} customerName={history.customerName} onClose={() => setInvoice(null)} /> : null}
    </div>
  )
}

// â€”â€”â€” Service history â€”â€”â€”
export function ServicesSection({ history }: { history: CustomerHistory }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const filtered = history.services.filter((s) => statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase())

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Service History</h1>
        <p className="mt-1 text-slate-600">Past and current workshop appointments and service records.</p>
      </header>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
        <option value="all">All statuses</option>
        <option value="Scheduled">Scheduled</option>
        <option value="Completed">Completed</option>
        <option value="Cancelled">Cancelled</option>
      </select>
      {filtered.length ? (
        <div className="grid gap-3">
          {filtered.map((s) => (
            <div key={s.appointmentId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
              <div>
                <p className="font-semibold text-slate-900">{s.serviceType}</p>
                <p className="text-sm text-slate-500">{formatDate(s.date)}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No service records" description="Book an appointment to start your service history." />
      )}
    </div>
  )
}

// â€”â€”â€” Appointments â€”â€”â€”
export function AppointmentsSection({
  appointments: initial,
  onChange,
  initialFocus = 'book',
}: {
  appointments: Appt[]
  onChange: (a: Appt[]) => void
  initialFocus?: 'book' | 'list'
}) {
  const { showToast } = useToast()
  const [appointments, setAppointments] = useState(initial)
  const bookRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0])
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 16)
  })
  const [rescheduleId, setRescheduleId] = useState<number | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')

  useEffect(() => {
    setAppointments(initial)
  }, [initial])

  useEffect(() => {
    const target = initialFocus === 'list' ? listRef.current : bookRef.current
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [initialFocus])

  async function refresh() {
    const a = await fetchMyAppointments()
    setAppointments(a)
    onChange(a)
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
        <p className="mt-1 text-slate-600">Book, reschedule, or cancel service appointments.</p>
      </header>

      <SectionCard title="Book a service">
        <div ref={bookRef}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void (async () => {
              try {
                await createAppointment({ serviceType, date: new Date(appointmentDate).toISOString(), status: 'Scheduled' })
                showToast('Appointment booked.', 'success')
                await refresh()
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Booking failed', 'error')
              }
            })()
          }}
          className="grid max-w-lg gap-4"
        >
          <label className="block text-sm">
            <span className="font-medium">Service type</span>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm">
              {SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Date & time</span>
            <input type="datetime-local" required value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" />
          </label>
          <button type="submit" className="w-fit rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Book appointment</button>
        </form>
        </div>
      </SectionCard>

      <SectionCard title="Your appointments">
        <div ref={listRef}>
        {appointments.length ? (
          <ul className="space-y-3">
            {appointments.map((a) => {
              const canModify = !['cancelled', 'completed'].includes(a.status.toLowerCase())
              return (
                <li key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-900">{a.serviceType}</p>
                        <p className="text-sm text-slate-500">{formatDate(a.date)}</p>
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  {canModify ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => { setRescheduleId(a.id); setRescheduleDate(a.date.slice(0, 16)) }} className="text-xs font-semibold text-blue-600 hover:underline">Reschedule</button>
                      <button
                        type="button"
                        onClick={() =>
                          void (async () => {
                            try {
                              await cancelAppointment(a.id)
                              showToast('Cancelled.', 'success')
                              await refresh()
                            } catch (err) {
                              showToast(err instanceof Error ? err.message : 'Failed', 'error')
                            }
                          })()
                        }
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                  {rescheduleId === a.id ? (
                    <form
                      className="mt-3 flex flex-wrap gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void (async () => {
                          try {
                            await updateAppointment(a.id, { date: new Date(rescheduleDate).toISOString() })
                            setRescheduleId(null)
                            showToast('Rescheduled.', 'success')
                            await refresh()
                          } catch (err) {
                            showToast(err instanceof Error ? err.message : 'Failed', 'error')
                          }
                        })()
                      }}
                    >
                      <input type="datetime-local" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="rounded-lg border px-2 py-1 text-sm" required />
                      <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Save</button>
                    </form>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title="No appointments" description="Book your first service using the form above." />
        )}
        </div>
      </SectionCard>
    </div>
  )
}

// â€”â€”â€” Part requests â€”â€”â€”
export function PartRequestsSection({
  requests: initial,
  onChange,
  onNavigate,
}: {
  requests: PartRequest[]
  onChange: (r: PartRequest[]) => void
  onNavigate?: (navId: import('./types').CustomerNavId) => void
}) {
  const { showToast } = useToast()
  const [requests, setRequests] = useState(initial)

  useEffect(() => {
    setRequests(initial)
  }, [initial])

  async function refresh() {
    const r = await fetchMyPartRequests()
    setRequests(r)
    onChange(r)
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">My Part Requests</h1>
        <p className="mt-1 text-slate-600">Track parts you have asked us to source.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex justify-between gap-2">
              <p className="font-semibold text-slate-900">{r.partName}</p>
              <StatusBadge status={r.status} />
            </div>
            {r.vehicleDetails ? <p className="mt-2 text-sm text-slate-600">{r.vehicleDetails}</p> : null}
            <p className="mt-1 text-xs text-slate-500">Qty: {r.quantity ?? 1}</p>
            {r.description ? <p className="mt-1 text-sm text-slate-500">{r.description}</p> : null}
            <p className="mt-3 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
            {r.status === 'Pending' ? (
              <button
                type="button"
                className="mt-3 text-xs font-semibold text-red-600"
                onClick={() =>
                  void (async () => {
                    if (!window.confirm('Cancel this request?')) return
                    try {
                      await deletePartRequest(r.id)
                      await refresh()
                      showToast('Cancelled.', 'success')
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : 'Failed', 'error')
                    }
                  })()
                }
              >
                Cancel request
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {!requests.length ? (
        <EmptyState
          title="No requests yet"
          description="Submit a request for parts we do not currently stock."
          action={
            onNavigate ? (
              <button
                type="button"
                onClick={() => onNavigate('request-part')}
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800"
              >
                Request a Part
              </button>
            ) : undefined
          }
        />
      ) : null}
    </div>
  )
}

// â€”â€”â€” Reviews â€”â€”â€”
export function ReviewsSection({ reviews: initial, onChange }: { reviews: Review[]; onChange: (r: Review[]) => void }) {
  const { showToast } = useToast()
  const [reviews, setReviews] = useState(initial)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [hover, setHover] = useState(0)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Reviews & Ratings</h1>
        <p className="mt-1 text-slate-600">Share your experience with our parts and service team.</p>
      </header>

      <SectionCard title="Leave a review">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void (async () => {
              try {
                await createReview({ rating, comment })
                setComment('')
                const r = await fetchMyReviews()
                setReviews(r)
                onChange(r)
                showToast('Thank you for your review!', 'success')
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Failed', 'error')
              }
            })()
          }}
          className="max-w-lg space-y-4"
        >
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} className="p-0.5">
                <StarIcon className={`h-8 w-8 ${n <= (hover || rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} required placeholder="Tell us about your experienceâ€¦" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
          <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Submit review</button>
        </form>
      </SectionCard>

      <SectionCard title="Your reviews">
        {reviews.length ? (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon key={n} className={`h-4 w-4 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-700">{r.comment}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No reviews yet" description="Be the first to share feedback about our service." />
        )}
      </SectionCard>
    </div>
  )
}

// â€”â€”â€” Notifications â€”â€”â€”
export function NotificationsSection({ notifications }: { notifications: CustomerNotification[] }) {
  const grouped = useMemo(() => {
    const order = ['Payment', 'Appointment', 'PartRequest', 'Loyalty']
    return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).sort(
      (a, b) => order.indexOf(a.type) - order.indexOf(b.type),
    )
  }, [notifications])

  const typeIcon = (type: string) => {
    if (type === 'Payment') return 'ðŸ’³'
    if (type === 'Appointment') return 'ðŸ“…'
    if (type === 'PartRequest') return 'ðŸ“¦'
    return 'â­'
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-slate-600">Payment reminders, appointment updates, and part request status.</p>
      </header>
      {grouped.length ? (
        <ul className="space-y-3">
          {grouped.map((n) => (
            <li key={n.id} className="flex gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <span className="text-2xl">{typeIcon(n.type)}</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{n.type}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No notifications" description="You're all caught up. Updates will appear here automatically." />
      )}
    </div>
  )
}

// â€”â€”â€” AI â€”â€”â€”
export function AiSection({ predictions }: { predictions: MaintenancePrediction[] }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">AI Vehicle Suggestions</h1>
        <p className="mt-1 text-slate-600">
          Personalized maintenance recommendations based on your mileage, purchase history, and service records.
        </p>
      </header>
      {predictions.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {predictions.map((p, i) => (
            <div
              key={`${p.component}-${i}`}
              className={[
                'rounded-2xl border p-5 shadow-sm',
                p.riskLevel === 'High' ? 'border-red-200 bg-red-50/30' : p.riskLevel === 'Medium' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex gap-3">
                  <SparklesIcon className="h-6 w-6 shrink-0 text-violet-600" />
                  <div>
                    <p className="font-bold text-slate-900">{p.component}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.recommendation}</p>
                    {p.estimatedKmUntilService > 0 ? (
                      <p className="mt-2 text-xs font-medium text-slate-500">~{p.estimatedKmUntilService.toLocaleString()} km until recommended service</p>
                    ) : null}
                  </div>
                </div>
                <StatusBadge status={`${p.riskLevel} risk`} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No suggestions yet"
          description="Add vehicles with current mileage to receive brake, battery, and service interval recommendations."
        />
      )}
    </div>
  )
}
