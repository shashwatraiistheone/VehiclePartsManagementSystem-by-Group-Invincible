import type { MaintenancePrediction } from '../../services/predictionApi'

export type PredictionSeverity = 'CRITICAL' | 'WARNING' | 'NORMAL'

export function mapPredictionSeverity(riskLevel: string): PredictionSeverity {
  const level = riskLevel.toLowerCase()
  if (level === 'high' || level === 'critical') return 'CRITICAL'
  if (level === 'medium' || level === 'warning') return 'WARNING'
  return 'NORMAL'
}

export function severityBadgeClass(severity: PredictionSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500/15 text-red-300 ring-1 ring-red-400/40'
    case 'WARNING':
      return 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/35'
    default:
      return 'bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/35'
  }
}

export function formatMilesFromKm(km: number): string {
  if (km <= 0) return ''
  const miles = Math.round(km * 0.621371)
  return miles.toLocaleString('en-US')
}

export function predictionDetailLine(p: MaintenancePrediction): string | null {
  if (p.estimatedKmUntilService <= 0) return null
  const miles = formatMilesFromKm(p.estimatedKmUntilService)
  return `Approx. ${miles} miles (${p.estimatedKmUntilService.toLocaleString()} km) until service`
}
