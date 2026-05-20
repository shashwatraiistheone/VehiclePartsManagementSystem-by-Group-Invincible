import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

export type PerformanceRow = {
  label: string
  labelShort: string
  revenue: number
  purchases: number
  profit: number
  revenuePct: number
}

export type SortKey = 'label' | 'revenue' | 'purchases' | 'profit' | 'revenuePct'
export type SortDir = 'asc' | 'desc'

export function formatRs(amount: number) {
  const sign = amount < 0 ? '-' : ''
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${sign}Rs. ${formatted}`
}

export function formatPct(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${Math.round(value)}%`
}

export function computeRevenuePct(revenue: number, profit: number) {
  if (revenue === 0) return 0
  return Math.round((profit / revenue) * 100)
}

export function computeGrowthPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export function toIsoDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function ChartTooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2.5 text-xs shadow-lg backdrop-blur-sm">
      <p className="mb-1.5 font-semibold text-slate-800">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatRs(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function SummaryCard({
  title,
  amount,
  subtitle,
  icon,
  className = 'bg-white',
  delay,
  visible,
}: {
  title: string
  amount: string
  subtitle: string
  icon: ReactNode
  className?: string
  delay: number
  visible: boolean
}) {
  return (
    <article
      className={[
        'group rounded-2xl border border-slate-200/80 p-5 shadow-sm transition-all duration-500 ease-out',
        'hover:-translate-y-1 hover:shadow-lg',
        className,
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      ].join(' ')}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 shadow-sm ring-1 ring-black/5 transition group-hover:scale-105">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{amount}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </article>
  )
}

export function RevenuePctBadge({ value }: { value: number }) {
  const positive = value > 0
  const neutral = value === 0
  return (
    <span
      className={[
        'inline-flex min-w-[3.25rem] items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold',
        neutral
          ? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
          : positive
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      ].join(' ')}
    >
      {formatPct(value)}
    </span>
  )
}

export function SortHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  align = 'left',
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  align?: 'left' | 'right' | 'center'
}) {
  const active = activeKey === sortKey
  const alignClass =
    align === 'right' ? 'text-right justify-end' : align === 'center' ? 'text-center justify-center' : 'text-left'

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex w-full items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:text-blue-600 ${alignClass}`}
    >
      {label}
      {active ? (
        dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <span className="h-3 w-3 opacity-0" />
      )}
    </button>
  )
}

export function PaginationBtn({
  children,
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  'aria-label': string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
