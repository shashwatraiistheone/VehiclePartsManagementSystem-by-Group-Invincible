import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Plus, Eye, Check, X, CircleCheck, Search } from 'lucide-react'

export type AppointmentStatus = 'pending' | 'approved' | 'completed' | 'rejected'

export type Appointment = {
  id: string
  customerName: string
  vehicleNumber: string
  serviceType: string
  /** ISO date string for appointment start */
  appointmentAt: string
  status: AppointmentStatus
  notes?: string
}

const SERVICE_OPTIONS = [
  'General service',
  'Oil change',
  'Brake inspection',
  'Diagnostics',
  'Tire rotation',
  'Battery check',
  'AC service',
] as const

function formatDisplayDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function statusLabel(s: AppointmentStatus): string {
  switch (s) {
    case 'pending':
      return 'Pending'
    case 'approved':
      return 'Approved'
    case 'completed':
      return 'Completed'
    case 'rejected':
      return 'Rejected'
    default:
      return s
  }
}

function statusBadgeClass(s: AppointmentStatus): string {
  const base = 'inline-flex rounded-lg px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset'
  switch (s) {
    case 'pending':
      return `${base} bg-amber-100 text-amber-950 ring-amber-200/80`
    case 'approved':
      return `${base} bg-blue-100 text-blue-900 ring-blue-200/80`
    case 'completed':
      return `${base} bg-emerald-100 text-emerald-900 ring-emerald-200/80`
    case 'rejected':
      return `${base} bg-red-100 text-red-900 ring-red-200/80`
    default:
      return base
  }
}

const SEED: Appointment[] = [
  {
    id: 'a1',
    customerName: 'Nimal Perera',
    vehicleNumber: 'CAB-4521',
    serviceType: 'Oil change',
    appointmentAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'pending',
    notes: 'Customer requested synthetic oil.',
  },
  {
    id: 'a2',
    customerName: 'Sithara Fernando',
    vehicleNumber: 'WP-KA-7788',
    serviceType: 'Brake inspection',
    appointmentAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'approved',
  },
  {
    id: 'a3',
    customerName: 'Kasun Silva',
    vehicleNumber: 'CAB-1190',
    serviceType: 'Diagnostics',
    appointmentAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'completed',
  },
  {
    id: 'a4',
    customerName: 'Dilani Jayawardena',
    vehicleNumber: 'GAA-4412',
    serviceType: 'AC service',
    appointmentAt: new Date(Date.now() + 3600000 * 8).toISOString(),
    status: 'rejected',
    notes: 'Slot moved to alternate workshop.',
  },
]

type FilterValue = AppointmentStatus | 'all'

export function AdminAppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>(SEED)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all')
  const [announce, setAnnounce] = useState('')

  const addFormId = useId()

  function announceMsg(message: string) {
    setAnnounce(message)
    window.setTimeout(() => setAnnounce(''), 3000)
  }

  const detail = rows.find((r) => r.id === detailId) ?? null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (q && !r.customerName.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, statusFilter])

  const updateStatus = useCallback((id: string, status: AppointmentStatus, actionLabel: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    )
    announceMsg(`${actionLabel}: appointment ${statusLabel(status)}.`)
  }, [])

  /* Escape closes dialogs */
  useEffect(() => {
    if (!detail && !addOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDetailId(null)
        setAddOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail, addOpen])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments &amp; Service Requests</h1>
          <p className="mt-1 text-slate-600">
            Review workshop bookings, approve or reject requests, and mark completed jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Add appointment
        </button>
      </div>

      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announce}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative flex flex-1 min-w-[200px] max-w-md items-center gap-2">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden />
          <span className="sr-only">Search by customer name</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name"
            autoComplete="off"
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none ring-blue-500/0 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="whitespace-nowrap font-medium text-slate-600">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterValue)}
            aria-label="Filter appointments by status"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Customer name</th>
                <th className="whitespace-nowrap px-4 py-3">Vehicle number</th>
                <th className="whitespace-nowrap px-4 py-3">Service type</th>
                <th className="whitespace-nowrap px-4 py-3">Appointment date</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No appointments match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{row.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.vehicleNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.serviceType}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDisplayDate(row.appointmentAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={statusBadgeClass(row.status)}>{statusLabel(row.status)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailId(row.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          View details
                        </button>
                        <button
                          type="button"
                          disabled={row.status !== 'pending'}
                          aria-disabled={row.status !== 'pending'}
                          onClick={() =>
                            row.status === 'pending' &&
                            updateStatus(row.id, 'approved', `Approved booking for ${row.customerName}`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={row.status !== 'pending' && row.status !== 'approved'}
                          aria-disabled={row.status !== 'pending' && row.status !== 'approved'}
                          onClick={() =>
                            (row.status === 'pending' || row.status === 'approved') &&
                            updateStatus(row.id, 'rejected', `Rejected booking for ${row.customerName}`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={row.status !== 'approved'}
                          aria-disabled={row.status !== 'approved'}
                          onClick={() =>
                            row.status === 'approved' &&
                            updateStatus(row.id, 'completed', `Completed service for ${row.customerName}`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Mark as completed
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDetailId(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="appt-detail-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none">
            <h2 id="appt-detail-title" className="text-lg font-bold text-slate-900">
              Appointment details
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Customer name</dt>
                <dd className="mt-1 text-slate-900">{detail.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Vehicle number</dt>
                <dd className="mt-1 text-slate-900">{detail.vehicleNumber}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Service type</dt>
                <dd className="mt-1 text-slate-900">{detail.serviceType}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Appointment date</dt>
                <dd className="mt-1 text-slate-900">{formatDisplayDate(detail.appointmentAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Status</dt>
                <dd className="mt-2">
                  <span className={statusBadgeClass(detail.status)}>{statusLabel(detail.status)}</span>
                </dd>
              </div>
              {detail.notes ? (
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">Notes</dt>
                  <dd className="mt-1 text-slate-700">{detail.notes}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addOpen ? (
        <AddAppointmentDialog
          formId={addFormId}
          onClose={() => setAddOpen(false)}
          onCreate={(a) => {
            setRows((prev) => [a, ...prev])
            setAddOpen(false)
            announceMsg(`New appointment added for ${a.customerName}.`)
          }}
        />
      ) : null}
    </div>
  )
}

function AddAppointmentDialog({
  formId,
  onClose,
  onCreate,
}: {
  formId: string
  onClose: () => void
  onCreate: (a: Appointment) => void
}) {
  const [customerName, setCustomerName] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [serviceType, setServiceType] = useState<string>(SERVICE_OPTIONS[0])
  const [appointmentAt, setAppointmentAt] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = `appt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    const iso = new Date(appointmentAt).toISOString()
    onCreate({
      id,
      customerName: customerName.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      serviceType,
      appointmentAt: iso,
      status: 'pending',
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-appt-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 id="add-appt-title" className="text-lg font-bold text-slate-900">
          Add appointment
        </h2>
        <p className="mt-1 text-sm text-slate-500">Creates a new request with status Pending.</p>
        <form id={formId} className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Customer name</span>
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoFocus
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
              placeholder="e.g. Saman Kumara"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Vehicle number</span>
            <input
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
              placeholder="e.g. CAA-1234"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Service type</span>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
            >
              {SERVICE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Appointment date &amp; time</span>
            <input
              type="datetime-local"
              required
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
              placeholder="Special instructions"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Save appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
