import type { CustomerHistory } from '../../services/customerApi'

export type MonthlySpendingPoint = {
  monthKey: string
  label: string
  total: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Aggregate customer purchase totals by calendar month (real sale data). */
export function buildMonthlySpending(
  purchases: CustomerHistory['purchases'],
  monthCount = 6,
): MonthlySpendingPoint[] {
  const now = new Date()
  const buckets: MonthlySpendingPoint[] = []

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.push({
      monthKey,
      label: MONTH_NAMES[d.getMonth()],
      total: 0,
    })
  }

  const bucketMap = new Map(buckets.map((b) => [b.monthKey, b]))

  for (const p of purchases) {
    const date = new Date(p.date)
    if (Number.isNaN(date.getTime())) continue
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const bucket = bucketMap.get(key)
    if (bucket) {
      bucket.total += p.finalAmount
    }
  }

  return buckets
}

export function formatSpendingAxis(value: number): string {
  if (value >= 100000) return `${Math.round(value / 1000)}k`
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return String(Math.round(value))
}

export function formatSpendingTooltip(value: number): string {
  return `Rs. ${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function spendingMonthOverMonthChange(points: MonthlySpendingPoint[]): number | null {
  if (points.length < 2) return null
  const prev = points[points.length - 2].total
  const curr = points[points.length - 1].total
  if (prev <= 0) return curr > 0 ? 100 : null
  return Math.round(((curr - prev) / prev) * 100)
}

export function hasSpendingData(points: MonthlySpendingPoint[]): boolean {
  return points.some((p) => p.total > 0)
}
