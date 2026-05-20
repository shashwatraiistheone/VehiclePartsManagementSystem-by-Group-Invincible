import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function formatMoney(n: number) {
  return `Rs ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const cls =
    s.includes('cancel') || s.includes('reject')
      ? 'bg-red-50 text-red-700 ring-red-200/80'
      : s.includes('complete') || s.includes('paid') || s.includes('available')
        ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
        : s.includes('sched') || s.includes('pending') || s.includes('ordered')
          ? 'bg-amber-50 text-amber-900 ring-amber-200/80'
          : 'bg-slate-100 text-slate-700 ring-slate-200/80'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {status}
    </span>
  )
}

export function CenteredStatCard({
  label,
  value,
  Icon,
  accent,
}: {
  label: string
  value: string
  Icon: LucideIcon
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 text-center shadow-sm transition hover:shadow-md">
      <div
        className={`mx-auto mb-3 inline-flex rounded-xl bg-gradient-to-br ${accent} p-3 text-white shadow-sm`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  Icon: LucideIcon
  accent: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${accent} p-2.5 text-white shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function LoadingState({ label = 'Loading your data…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export function SectionCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
