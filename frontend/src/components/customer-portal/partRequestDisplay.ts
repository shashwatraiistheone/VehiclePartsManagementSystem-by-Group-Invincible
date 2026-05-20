export function formatRequestDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRequestDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function displayPartRequestStatus(status: string): string {
  const s = status.trim().toLowerCase()
  if (s === 'available') return 'Fulfilled'
  return status.trim().charAt(0).toUpperCase() + status.trim().slice(1).toLowerCase()
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  ordered: 'bg-blue-50 text-blue-800 ring-blue-200/70',
  arrived: 'bg-violet-50 text-violet-800 ring-violet-200/70',
  fulfilled: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  available: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  rejected: 'bg-red-50 text-red-700 ring-red-200/70',
}

export function partRequestStatusBadgeClass(status: string): string {
  const key = status.trim().toLowerCase()
  return STATUS_STYLES[key] ?? 'bg-slate-100 text-slate-700 ring-slate-200/70'
}

export function responseNotesPreview(
  responseNotes?: string | null,
  fallbackDescription?: string | null,
): string {
  const staff = responseNotes?.trim()
  if (staff) return staff
  const desc = fallbackDescription?.trim()
  if (desc) return desc
  return '—'
}
