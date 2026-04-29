import type { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  Icon: LucideIcon
  pending?: boolean
  highlight?: boolean
  onClick?: () => void
}

/**
 * Home dashboard module tile — equal height, SaaS-style card.
 */
export function DashboardFeatureCard({ title, Icon, pending, highlight, onClick }: Props) {
  const iconWrap = pending
    ? 'bg-slate-200 text-slate-400'
    : 'bg-blue-50 text-blue-600'

  if (pending) {
    return (
      <div
        className={[
          'flex h-full min-h-[168px] w-full cursor-not-allowed flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/90 p-6 text-center shadow-md opacity-[0.72]',
        ].join(' ')}
        aria-disabled
      >
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconWrap}`}>
          <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </div>
        <span className="mt-4 text-sm font-semibold leading-snug text-slate-500">{title}</span>
        <span className="mt-2 text-[10px] font-bold uppercase tracking-wide text-rose-600">Pending</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex h-full min-h-[168px] w-full flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white p-6 text-center shadow-md transition',
        'hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg',
        highlight ? 'ring-2 ring-blue-500/35 ring-offset-2 ring-offset-gray-100' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full transition group-hover:scale-[1.03] ${iconWrap}`}
      >
        <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
      </div>
      <span className="mt-4 text-sm font-semibold leading-snug text-slate-800">{title}</span>
    </button>
  )
}
