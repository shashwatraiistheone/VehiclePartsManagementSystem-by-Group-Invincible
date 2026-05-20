import type { Appointment } from '../../services/appointmentApi'
import type { Vehicle } from '../../services/customerApi'

export function vehicleLabel(appointment: Appointment, vehicles: Vehicle[]): string {
  const match = vehicles.find(
    (v) => v.vehicleNumber.toUpperCase() === appointment.vehicleNumber?.toUpperCase(),
  )
  if (match) {
    return `${match.brand} ${match.model} (${match.vehicleNumber})`
  }
  if (appointment.vehicleNumber) {
    return appointment.vehicleNumber
  }
  return '—'
}

export function formatAppointmentDateTime(iso: string): { dateLabel: string; timeRange: string } {
  const start = new Date(iso)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const dateLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeFmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true })
  return { dateLabel, timeRange: `${timeFmt(start)} - ${timeFmt(end)}` }
}

/** Staff manage-appointments table: uniform gray service badges per design spec. */
export function serviceTypeBadgeClass(_serviceType: string): string {
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  scheduled: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-blue-100 text-blue-800 ring-blue-200',
  confirmed: 'bg-blue-100 text-blue-800 ring-blue-200',
  completed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 ring-rose-200',
  canceled: 'bg-rose-100 text-rose-800 ring-rose-200',
  rejected: 'bg-rose-100 text-rose-800 ring-rose-200',
}

export function statusBadgeClass(status: string): string {
  return STATUS_STYLES[status.trim().toLowerCase()] ?? 'bg-slate-100 text-slate-700 ring-slate-200/60'
}

export function formatStatusLabel(status: string): string {
  const s = status.trim().toLowerCase()
  if (s === 'canceled' || s === 'cancelled') return 'Cancelled'
  if (s === 'scheduled' || s === 'pending') return 'Pending'
  if (s === 'approved' || s === 'confirmed') return 'Confirmed'
  if (s === 'completed') return 'Completed'
  if (s === 'rejected') return 'Cancelled'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function statusBucket(status: string): 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'other' {
  const s = status.trim().toLowerCase()
  if (s === 'scheduled' || s === 'pending') return 'pending'
  if (s === 'approved' || s === 'confirmed') return 'confirmed'
  if (s === 'cancelled' || s === 'canceled' || s === 'rejected') return 'cancelled'
  if (s === 'completed') return 'completed'
  return 'other'
}

export function backendStatusForAction(action: 'confirm' | 'cancel' | 'complete'): string {
  if (action === 'confirm') return 'Approved'
  if (action === 'cancel') return 'Cancelled'
  return 'Completed'
}

/** Appointment details page status pills per design spec. */
export function detailStatusBadgeClass(status: string): string {
  const bucket = statusBucket(status)
  if (bucket === 'pending') return 'bg-amber-100 text-amber-800 ring-amber-200'
  if (bucket === 'confirmed') return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
  if (bucket === 'cancelled') return 'bg-rose-100 text-rose-800 ring-rose-200'
  if (bucket === 'completed') return 'bg-blue-100 text-blue-800 ring-blue-200'
  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatTimeSlotRange(iso: string): string {
  const { timeRange } = formatAppointmentDateTime(iso)
  return timeRange.replace(' - ', ' – ')
}

export function formatAppointmentDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

export function isoToLocalDateInput(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isoToSlotTime(iso: string): string {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

export function canCancelAppointment(status: string): boolean {
  const s = status.trim().toLowerCase()
  return s !== 'cancelled' && s !== 'canceled' && s !== 'completed'
}

export function cancellationNote(appointment: Appointment): string | null {
  const s = appointment.status.trim().toLowerCase()
  if (s !== 'cancelled' && s !== 'canceled') return null
  const note = appointment.notes?.trim()
  return note || null
}
