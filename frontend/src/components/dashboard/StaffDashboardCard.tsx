import type { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  description?: string
  Icon: LucideIcon
  onClick: () => void
}

/**
 * Staff dashboard feature tile — completed modules only.
 */
export function StaffDashboardCard({ title, description, Icon, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full min-h-[168px] w-full flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white p-6 text-center shadow-md transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:scale-[1.03]">
        <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
      </div>
      <span className="mt-4 text-sm font-semibold leading-snug text-slate-800">{title}</span>
      {description ? (
        <span className="mt-1 max-w-[14rem] text-xs leading-relaxed text-slate-500">{description}</span>
      ) : null}
    </button>
  )
}
