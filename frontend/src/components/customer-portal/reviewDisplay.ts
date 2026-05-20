export function reviewStatusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'approved') return 'Approved'
  if (s === 'rejected') return 'Rejected'
  return 'Pending'
}

export function reviewStatusClass(status: string): string {
  const s = status.toLowerCase()
  if (s === 'approved') return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
  if (s === 'rejected') return 'bg-red-50 text-red-700 ring-red-200/80'
  return 'bg-amber-50 text-amber-900 ring-amber-200/80'
}
