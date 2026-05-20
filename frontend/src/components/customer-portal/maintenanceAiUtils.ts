export type AiSeverity = 'CRITICAL' | 'WARNING' | 'NORMAL' | 'GOOD'

export function normalizeAiSeverity(severity: string): AiSeverity {
  const s = severity.toUpperCase()
  if (s === 'CRITICAL' || s === 'HIGH') return 'CRITICAL'
  if (s === 'WARNING' || s === 'MEDIUM') return 'WARNING'
  if (s === 'GOOD' || s === 'LOW') return 'GOOD'
  return 'NORMAL'
}

export function severityPillClass(severity: AiSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-600 text-white'
    case 'WARNING':
      return 'bg-amber-500 text-white'
    case 'GOOD':
      return 'bg-emerald-600 text-white'
    default:
      return 'bg-blue-600 text-white'
  }
}

export function cardSurfaceClass(severity: AiSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-gradient-to-br from-red-50 via-red-50/80 to-rose-50 border-red-100'
    case 'WARNING':
      return 'bg-gradient-to-br from-amber-50 via-yellow-50/80 to-orange-50 border-amber-100'
    case 'GOOD':
      return 'bg-gradient-to-br from-emerald-50 via-green-50/80 to-teal-50 border-emerald-100'
    default:
      return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
  }
}

export function progressBarClass(severity: AiSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500'
    case 'WARNING':
      return 'bg-gradient-to-r from-amber-400 to-lime-500'
    case 'GOOD':
      return 'bg-emerald-500'
    default:
      return 'bg-blue-500'
  }
}

export function progressTrackClass(severity: AiSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-100'
    case 'WARNING':
      return 'bg-amber-100'
    case 'GOOD':
      return 'bg-emerald-100'
    default:
      return 'bg-slate-100'
  }
}

export function fleetScoreBadgeClass(score: number): string {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (score >= 55) return 'bg-amber-50 text-amber-800 ring-amber-200'
  return 'bg-red-50 text-red-700 ring-red-200'
}

export function formatReplaceByDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatComponentTitle(name: string): string {
  return name.toUpperCase()
}

export function formatRelativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso)
  const diffMs = now.getTime() - then.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `Updated ${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}
