import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  cancelAppointmentById,
  confirmAppointment,
  fetchAppointmentDetail,
  fetchSlotAvailability,
  rescheduleAppointment,
  type AppointmentDetail,
  type SlotAvailability,
} from '../../../services/appointmentApi'
import { staffPath } from '../../../staff/staffRoutes'
import {
  detailStatusBadgeClass,
  formatAppointmentDateLabel,
  formatCreatedAt,
  formatStatusLabel,
  formatTimeSlotRange,
  isoToLocalDateInput,
  isoToSlotTime,
  statusBucket,
} from '../../customer-portal/appointmentDisplay'
import { AppointmentTimeSlotPicker } from '../../customer-portal/AppointmentTimeSlotPicker'
import { useToast } from '../../ui/ToastProvider'

function InfoBox({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Calendar
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className="h-4 w-4 text-blue-600" />
        {label}
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded-lg bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="h-48 rounded-2xl bg-slate-100" />
          <div className="h-36 rounded-2xl bg-slate-100" />
        </div>
        <div className="h-56 rounded-2xl bg-slate-100" />
      </div>
    </div>
  )
}

export function StaffAppointmentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const appointmentId = Number(id)

  const [detail, setDetail] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('09:00')
  const [slotLoading, setSlotLoading] = useState(false)
  const [slotMap, setSlotMap] = useState<Map<string, SlotAvailability>>(new Map())

  const load = useCallback(async () => {
    if (!appointmentId || Number.isNaN(appointmentId)) {
      setError('Invalid appointment id')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAppointmentDetail(appointmentId)
      setDetail(data)
      setRescheduleDate(isoToLocalDateInput(data.date))
      setRescheduleTime(isoToSlotTime(data.date))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!rescheduleOpen || !rescheduleDate) return
    setSlotLoading(true)
    void fetchSlotAvailability(rescheduleDate)
      .then((day) => {
        const map = new Map<string, SlotAvailability>()
        for (const slot of day.slots) map.set(slot.time, slot)
        setSlotMap(map)
      })
      .catch(() => setSlotMap(new Map()))
      .finally(() => setSlotLoading(false))
  }, [rescheduleOpen, rescheduleDate])

  async function handleConfirm() {
    if (!detail) return
    setActionBusy(true)
    try {
      await confirmAppointment(detail.id)
      showToast('Appointment confirmed successfully', 'success')
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Confirm failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleCancel() {
    if (!detail) return
    const ok = window.confirm(
      `Cancel appointment #${detail.id} for ${detail.customer.name}? This cannot be undone.`,
    )
    if (!ok) return
    setActionBusy(true)
    try {
      await cancelAppointmentById(detail.id)
      showToast('Appointment cancelled', 'success')
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cancel failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  async function handleRescheduleSave() {
    if (!detail || !rescheduleDate || !rescheduleTime) return
    setActionBusy(true)
    try {
      await rescheduleAppointment(detail.id, rescheduleDate, rescheduleTime)
      showToast('Appointment rescheduled successfully', 'success')
      setRescheduleOpen(false)
      await load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Reschedule failed', 'error')
    } finally {
      setActionBusy(false)
    }
  }

  const bucket = detail ? statusBucket(detail.status) : 'other'
  const canConfirm = bucket === 'pending'
  const canCancel = bucket === 'pending' || bucket === 'confirmed'
  const canReschedule = bucket !== 'cancelled' && bucket !== 'completed'

  if (loading) {
    return <DetailSkeleton />
  }

  if (error || !detail) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="font-semibold text-rose-800">{error ?? 'Appointment not found'}</p>
        <Link
          to={staffPath('appointments')}
          className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <header>
        <Link
          to={staffPath('appointments')}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointment Details</h1>
            <p className="mt-1 text-lg font-semibold text-slate-800">Appointment #{detail.id}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Created on {formatCreatedAt(detail.createdAt)}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 self-start rounded-full px-3 py-1.5 text-xs font-bold uppercase ring-1 ring-inset ${detailStatusBadgeClass(detail.status)}`}
          >
            {formatStatusLabel(detail.status)}
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/30 ring-1 ring-slate-100">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              Appointment Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoBox
                label="Date"
                value={formatAppointmentDateLabel(detail.date)}
                icon={Calendar}
              />
              <InfoBox
                label="Time Slot"
                value={formatTimeSlotRange(detail.date)}
                icon={Clock}
              />
              <InfoBox label="Service Type" value={detail.serviceType} icon={Wrench} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/30 ring-1 ring-slate-100">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <User className="h-4 w-4 text-blue-600" />
              Customer Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" value={detail.customer.name} icon={User} />
              <Field label="Phone" value={detail.customer.phone || '—'} icon={Phone} />
              <Field label="Email" value={detail.customer.email || '—'} icon={Mail} />
              <Field label="Address" value={detail.customer.address || '—'} icon={MapPin} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/30 ring-1 ring-slate-100">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <Car className="h-4 w-4 text-blue-600" />
              Vehicle Information
            </h2>
            {detail.vehicle ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Make" value={detail.vehicle.make || '—'} />
                <Field label="Model" value={detail.vehicle.model || '—'} />
                <Field label="Year" value={detail.vehicle.year ? String(detail.vehicle.year) : '—'} />
                <Field label="VIN" value={detail.vehicle.vin || '—'} />
                <Field
                  label="Registration Number"
                  value={detail.vehicle.registrationNumber || '—'}
                  className="sm:col-span-2"
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">No vehicle linked to this appointment.</p>
            )}
          </section>

          {detail.notes?.trim() ? (
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/30 ring-1 ring-slate-100">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">Notes</h2>
              <p className="text-sm leading-relaxed text-slate-700">{detail.notes.trim()}</p>
            </section>
          ) : null}

          {detail.history.length > 0 ? (
            <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/30 ring-1 ring-slate-100">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                Appointment History
              </h2>
              <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
                {detail.history.map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 ring-2 ring-blue-100" />
                    <p className="text-sm font-semibold text-slate-900">{item.serviceType}</p>
                    <p className="text-xs text-slate-500">
                      {formatAppointmentDateLabel(item.date)} · {formatStatusLabel(item.status)}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/staff/appointments/${item.id}`)}
                      className="mt-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View #{item.id}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Actions</h2>
            <div className="flex flex-col gap-3">
              {canConfirm ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleConfirm()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirm Appointment
                </button>
              ) : null}
              {canReschedule ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setRescheduleOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4" />
                  Reschedule
                </button>
              ) : null}
              {canCancel ? (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void handleCancel()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  Cancel Appointment
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {rescheduleOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setRescheduleOpen(false)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setRescheduleOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900">Reschedule Appointment</h3>
            <p className="mt-1 text-sm text-slate-500">Choose a new date and available time slot.</p>
            <label className="mt-4 block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                New Date
              </span>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Available Time Slots
            </p>
            <AppointmentTimeSlotPicker
              availability={slotMap}
              selectedTime={rescheduleTime}
              onSelect={setRescheduleTime}
              loading={slotLoading}
            />
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => void handleRescheduleSave()}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {actionBusy ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setRescheduleOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  icon: Icon,
  className = '',
}: {
  label: string
  value: string
  icon?: typeof User
  className?: string
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}
