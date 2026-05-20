import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import type { Vehicle } from '../../services/customerApi'
import {
  createAppointment,
  fetchMyAppointments,
  fetchServiceTypes,
  fetchSlotAvailability,
  type Appointment,
  type SlotAvailability,
} from '../../services/appointmentApi'
import { useToast } from '../ui/ToastProvider'
import { AppointmentTimeSlotPicker } from './AppointmentTimeSlotPicker'
import { LoadingState } from './shared'
import type { CustomerNavId } from './types'
import {
  ADVANCE_BOOKING_ERROR,
  APPOINTMENT_TIME_SLOTS,
  buildAppointmentIso,
  earliestBookableDateString,
  meetsAdvanceBookingRule,
  SLOT_FULL_ERROR,
} from './appointmentConstants'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15'
const labelClass = 'block text-xs font-semibold text-slate-600'

type FieldErrors = {
  vehicle?: string
  serviceType?: string
  date?: string
  timeSlot?: string
}

type Props = {
  vehicles: Vehicle[]
  onAppointmentsChange: (a: Appointment[]) => void
  onNavigate: (navId: CustomerNavId) => void
}

function slotMapFromApi(slots: SlotAvailability[]): Map<string, SlotAvailability> {
  return new Map(slots.map((s) => [s.time, s]))
}

export function BookServicePage({ vehicles, onAppointmentsChange, onNavigate }: Props) {
  const { showToast } = useToast()
  const [serviceTypes, setServiceTypes] = useState<string[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [vehicleNumber, setVehicleNumber] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [appointmentDate, setAppointmentDate] = useState(() => earliestBookableDateString())
  const [timeSlot, setTimeSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [slotAvailability, setSlotAvailability] = useState<Map<string, SlotAvailability>>(new Map())

  const minBookableDate = useMemo(() => earliestBookableDateString(), [])

  const loadSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true)
      try {
        const data = await fetchSlotAvailability(date)
        const map = slotMapFromApi(data.slots)
        setSlotAvailability(map)

        setTimeSlot((prev) => {
          if (prev) {
            const current = map.get(prev)
            if (current?.isBookable) return prev
          }
          const firstOpen = data.slots.find((s) => s.isBookable)
          return firstOpen?.time ?? ''
        })
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to load time slots', 'error')
      } finally {
        setLoadingSlots(false)
      }
    },
    [showToast],
  )

  useEffect(() => {
    let cancelled = false
    setLoadingTypes(true)
    void fetchServiceTypes()
      .then((types) => {
        if (cancelled) return
        setServiceTypes(types)
        if (types.length > 0) setServiceType(types[0])
      })
      .catch((err) => {
        if (!cancelled) {
          showToast(err instanceof Error ? err.message : 'Failed to load service types', 'error')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false)
      })
    return () => {
      cancelled = true
    }
  }, [showToast])

  useEffect(() => {
    if (vehicles.length > 0 && !vehicleNumber) {
      setVehicleNumber(vehicles[0].vehicleNumber)
    }
  }, [vehicles, vehicleNumber])

  useEffect(() => {
    if (appointmentDate) void loadSlots(appointmentDate)
  }, [appointmentDate, loadSlots])

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!vehicleNumber) next.vehicle = 'Please select a vehicle.'
    if (!serviceType) next.serviceType = 'Please select a service type.'
    if (!appointmentDate) next.date = 'Please choose an appointment date.'
    if (!timeSlot) {
      next.timeSlot = 'Please select an available time slot.'
    } else {
      const slot = slotAvailability.get(timeSlot)
      if (!meetsAdvanceBookingRule(appointmentDate, timeSlot)) {
        next.timeSlot = ADVANCE_BOOKING_ERROR
      } else if (slot?.isFull) {
        next.timeSlot = SLOT_FULL_ERROR
      } else if (slot && !slot.isBookable) {
        next.timeSlot = slot.reason ?? 'This time slot is not available.'
      }
    }
    if (appointmentDate && appointmentDate < minBookableDate) {
      next.date = ADVANCE_BOOKING_ERROR
    }
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) {
      const first = Object.values(validation)[0]
      if (first) showToast(first, 'error')
      return
    }

    const dateIso = buildAppointmentIso(appointmentDate, timeSlot)
    setSaving(true)
    try {
      await createAppointment({
        serviceType,
        date: dateIso,
        status: 'Pending',
        vehicleNumber,
        notes: notes.trim() || undefined,
      })
      const list = await fetchMyAppointments()
      onAppointmentsChange(list)
      showToast('Appointment confirmed successfully.', 'success')
      onNavigate('service-records')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Booking failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loadingTypes && serviceTypes.length === 0) {
    return <LoadingState label="Loading booking options…" />
  }

  const hasBookableSlot = APPOINTMENT_TIME_SLOTS.some((s) => slotAvailability.get(s.value)?.isBookable)

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-1 py-2 sm:px-0">
      <article className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50">
        <header className="border-b border-slate-100 px-6 py-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <CalendarDaysIcon className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-900">Book Service</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a date and time that works best for you
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Appointments must be booked at least 24 hours in advance. Max 5 bookings per time slot.
          </p>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-6 py-6" noValidate>
          <div>
            <label className={labelClass} htmlFor="book-vehicle">
              Select Vehicle
            </label>
            <select
              id="book-vehicle"
              value={vehicleNumber}
              onChange={(e) => {
                setVehicleNumber(e.target.value)
                setErrors((prev) => ({ ...prev, vehicle: undefined }))
              }}
              className={`${inputClass} ${errors.vehicle ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15' : ''}`}
              disabled={vehicles.length === 0}
            >
              {vehicles.length === 0 ? (
                <option value="">No vehicles registered</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.id} value={v.vehicleNumber}>
                    {v.brand} {v.model} ({v.vehicleNumber})
                  </option>
                ))
              )}
            </select>
            {errors.vehicle ? (
              <p className="mt-1 text-xs text-red-600">{errors.vehicle}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="book-service-type">
              Service Type
            </label>
            <select
              id="book-service-type"
              value={serviceType}
              onChange={(e) => {
                setServiceType(e.target.value)
                setErrors((prev) => ({ ...prev, serviceType: undefined }))
              }}
              className={`${inputClass} ${errors.serviceType ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15' : ''}`}
              disabled={serviceTypes.length === 0}
            >
              {serviceTypes.length === 0 ? (
                <option value="">Loading…</option>
              ) : (
                serviceTypes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
            {errors.serviceType ? (
              <p className="mt-1 text-xs text-red-600">{errors.serviceType}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="book-date">
              Appointment Date
            </label>
            <input
              id="book-date"
              type="date"
              value={appointmentDate}
              onChange={(e) => {
                setAppointmentDate(e.target.value)
                setTimeSlot('')
                setErrors((prev) => ({ ...prev, date: undefined, timeSlot: undefined }))
              }}
              className={`${inputClass} ${errors.date ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15' : ''}`}
              min={minBookableDate}
            />
            {errors.date ? <p className="mt-1 text-xs text-red-600">{errors.date}</p> : null}
          </div>

          <div>
            <p className={labelClass}>Preferred Time</p>
            <AppointmentTimeSlotPicker
              availability={slotAvailability}
              selectedTime={timeSlot}
              loading={loadingSlots}
              onSelect={(value) => {
                setTimeSlot(value)
                setErrors((prev) => ({ ...prev, timeSlot: undefined }))
              }}
            />
            {errors.timeSlot ? (
              <p className="mt-1.5 text-xs text-red-600">{errors.timeSlot}</p>
            ) : null}
            {!loadingSlots && !hasBookableSlot ? (
              <p className="mt-2 text-xs text-amber-700">
                No slots available on this date. Choose a later date (at least 24 hours ahead).
              </p>
            ) : null}
          </div>

          <label className={labelClass} htmlFor="book-notes">
            Notes / Description
            <textarea
              id="book-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Describe the issue or any special requests (optional)"
            />
          </label>

          <button
            type="submit"
            disabled={
              saving ||
              vehicles.length === 0 ||
              serviceTypes.length === 0 ||
              !timeSlot ||
              !hasBookableSlot
            }
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Confirming…' : 'Confirm Appointment'}
          </button>

          {vehicles.length === 0 ? (
            <p className="text-center text-xs text-slate-500">
              Register a vehicle under Profile & Vehicles before booking.
            </p>
          ) : null}
        </form>
      </article>
    </div>
  )
}
