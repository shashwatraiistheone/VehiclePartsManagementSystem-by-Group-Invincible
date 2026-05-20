import type { ComponentType, SVGProps } from 'react'

type Props = {
  label: string
  value: string
  sub?: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  accent?: 'default' | 'emerald' | 'amber'
}

const accentMap = {
  default: 'text-blue-600 bg-blue-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  amber: 'text-amber-600 bg-amber-50',
}

export function StatCard({ label, value, sub, Icon, accent = 'default' }: Props) {
  return (
    <div className="vms-card-hover group flex flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${accentMap[accent]}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  )
}
