/** Bookable time slots (24h value → display range label). Eight daily slots. */
export const APPOINTMENT_TIME_SLOTS = [
  { value: '09:00', label: '09:00 AM - 10:00 AM' },
  { value: '10:00', label: '10:00 AM - 11:00 AM' },
  { value: '11:00', label: '11:00 AM - 12:00 PM' },
  { value: '12:00', label: '12:00 PM - 01:00 PM' },
  { value: '13:00', label: '01:00 PM - 02:00 PM' },
  { value: '14:00', label: '02:00 PM - 03:00 PM' },
  { value: '15:00', label: '03:00 PM - 04:00 PM' },
  { value: '16:00', label: '04:00 PM - 05:00 PM' },
] as const

export const MAX_BOOKINGS_PER_SLOT = 5
export const MIN_ADVANCE_HOURS = 24

export const ADVANCE_BOOKING_ERROR =
  'Appointments must be booked at least 24 hours in advance.'

export const SLOT_FULL_ERROR = 'This time slot is fully booked. Please choose another time.'

export const DEFAULT_TIME_SLOT = APPOINTMENT_TIME_SLOTS[0].value

/** JavaScript Date.getTimezoneOffset() — minutes to add to local time to get UTC. */
export function getTimezoneOffsetMinutes(): number {
  return new Date().getTimezoneOffset()
}

/** Builds the UTC ISO string for a local date + slot (same as backend expects). */
export function buildAppointmentIso(date: string, slotTime: string): string {
  return new Date(`${date}T${slotTime}:00`).toISOString()
}

/** Whether the appointment is at least 24 hours from now (client-side check). */
export function meetsAdvanceBookingRule(date: string, slotTime: string, now = new Date()): boolean {
  const appointment = new Date(`${date}T${slotTime}:00`)
  const diffHours = (appointment.getTime() - now.getTime()) / (1000 * 60 * 60)
  return diffHours >= MIN_ADVANCE_HOURS
}

/** Earliest local calendar date that may have a bookable slot (24h rule). */
export function earliestBookableDateString(now = new Date()): string {
  const earliest = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000)
  const y = earliest.getFullYear()
  const m = String(earliest.getMonth() + 1).padStart(2, '0')
  const d = String(earliest.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
