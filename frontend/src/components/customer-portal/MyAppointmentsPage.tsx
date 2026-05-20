import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  TruckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { Vehicle } from '../../services/customerApi'
import {
  cancelAppointment,
  fetchMyAppointments,
  type Appointment,
} from '../../services/appointmentApi'
import { useToast } from '../ui/ToastProvider'
import { EmptyState } from './shared'
import type { CustomerNavId } from './types'
import {
  cancellationNote,
  canCancelAppointment,
  formatAppointmentDateTime,
  formatStatusLabel,
  serviceTypeBadgeClass,
  statusBadgeClass,
  vehicleLabel,
} from './appointmentDisplay'

type Props = {
  vehicles: Vehicle[]
  appointments: Appointment[]
  onAppointmentsChange: (a: Appointment[]) => void
  onNavigate: (navId: CustomerNavId) => void
}

export function MyAppointmentsPage({
  vehicles,
  appointments: initial,
  onAppointmentsChange,
  onNavigate,
}: Props) {
  const { showToast } = useToast()
  const [appointments, setAppointments] = useState(initial)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    setAppointments(initial)
  }, [initial])

  async function refresh() {
    setRefreshing(true)
    try {
      const list = await fetchMyAppointments()
      setAppointments(list)
      onAppointmentsChange(list)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load appointments', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const rows = useMemo(
    () =>
      [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments],
  )

  async function confirmCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelAppointment(cancelTarget.id, cancelReason.trim() || undefined)
      showToast('Appointment cancelled.', 'success')
      setCancelTarget(null)
      setCancelReason('')
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cancel failed', 'error')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          My Appointments
        </h1>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Scheduled Services</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your upcoming and past vehicle appointments
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('book-service')}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 active:scale-[0.98]"
        >
          <PlusIcon className="h-4 w-4 stroke-[2.5]" />
          New Appointment
        </button>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {refreshing ? (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-blue-600/20" aria-hidden>
            <div className="h-full w-1/3 animate-pulse bg-blue-600" />
          </div>
        ) : null}

        {rows.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No appointments yet"
              description="Book a service to schedule your first appointment."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Vehicle</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Date & Time</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Service Type</th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a, index) => (
                    <AppointmentRow
                      key={a.id}
                      appointment={a}
                      vehicles={vehicles}
                      striped={index % 2 === 1}
                      onCancel={() => setCancelTarget(a)}
                      onReschedule={() => onNavigate('book-service')}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  vehicles={vehicles}
                  onCancel={() => setCancelTarget(a)}
                  onReschedule={() => onNavigate('book-service')}
                />
              ))}
            </ul>
          </>
        )}
      </section>

      {cancelTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="cancel-title" className="text-sm font-semibold text-slate-900">
                  Cancel appointment
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {vehicleLabel(cancelTarget, vehicles)} · {cancelTarget.serviceType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCancelTarget(null)
                  setCancelReason('')
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <label className="mt-4 block text-xs font-semibold text-slate-600">
              Reason (optional)
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
                placeholder="e.g. Vehicle already serviced elsewhere"
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => void confirmCancel()}
                disabled={cancelling}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelling ? 'Cancelling…' : 'Confirm cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCancelTarget(null)
                  setCancelReason('')
                }}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AppointmentRow({
  appointment,
  vehicles,
  striped,
  onCancel,
  onReschedule,
}: {
  appointment: Appointment
  vehicles: Vehicle[]
  striped: boolean
  onCancel: () => void
  onReschedule: () => void
}) {
  const { dateLabel, timeRange } = formatAppointmentDateTime(appointment.date)
  const cancelNote = cancellationNote(appointment)
  const cancellable = canCancelAppointment(appointment.status)

  return (
    <tr
      className={[
        'border-b border-slate-100 last:border-b-0',
        striped ? 'bg-slate-50/40' : 'bg-white',
      ].join(' ')}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <TruckIcon className="h-4 w-4" />
          </span>
          <span className="text-sm font-medium text-slate-900">
            {vehicleLabel(appointment, vehicles)}
          </span>
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-start gap-2">
          <CalendarDaysIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-slate-900">{dateLabel}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <ClockIcon className="h-3.5 w-3.5" />
              {timeRange}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${serviceTypeBadgeClass(appointment.serviceType)}`}
        >
          {appointment.serviceType}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(appointment.status)}`}
          >
            {formatStatusLabel(appointment.status)}
          </span>
          {cancelNote ? (
            <p className="max-w-[200px] text-[11px] leading-snug text-slate-500">{cancelNote}</p>
          ) : null}
        </div>
      </td>
      <td className="px-5 py-4 text-right">
        {cancellable ? (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={onReschedule}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
    </tr>
  )
}

function AppointmentCard({
  appointment,
  vehicles,
  onCancel,
  onReschedule,
}: {
  appointment: Appointment
  vehicles: Vehicle[]
  onCancel: () => void
  onReschedule: () => void
}) {
  const { dateLabel, timeRange } = formatAppointmentDateTime(appointment.date)
  const cancelNote = cancellationNote(appointment)
  const cancellable = canCancelAppointment(appointment.status)

  return (
    <li className="space-y-3 p-4">
      <div className="flex items-start gap-2">
        <TruckIcon className="mt-0.5 h-4 w-4 text-slate-400" />
        <p className="text-sm font-medium text-slate-900">{vehicleLabel(appointment, vehicles)}</p>
      </div>
      <div className="flex items-start gap-2 text-sm text-slate-600">
        <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
        <div>
          <p className="font-medium text-slate-900">{dateLabel}</p>
          <p className="text-xs">{timeRange}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${serviceTypeBadgeClass(appointment.serviceType)}`}
        >
          {appointment.serviceType}
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadgeClass(appointment.status)}`}
        >
          {formatStatusLabel(appointment.status)}
        </span>
      </div>
      {cancelNote ? <p className="text-xs text-slate-500">{cancelNote}</p> : null}
      {cancellable ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReschedule}
            className="text-xs font-semibold text-blue-600"
          >
            Reschedule
          </button>
          <button type="button" onClick={onCancel} className="text-xs font-semibold text-red-600">
            Cancel
          </button>
        </div>
      ) : null}
    </li>
  )
}
