import type { ScenarioFeature } from '../../features/adminScenarioFeatures'
import type { TabId } from '../layout/Sidebar'

type Props = {
  feature: ScenarioFeature
  onNavigate: (tab: TabId) => void
}

export function ScenarioFeatureCard({ feature, onNavigate }: Props) {
  const { title, description, status, navigateTo, Icon } = feature
  const completed = status === 'Completed'
  const canNavigate = completed && navigateTo != null

  const badge =
    status === 'Completed' ? (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
        Completed
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-200/80">
        Pending
      </span>
    )

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={[
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
            completed
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25 ring-blue-400/30'
              : 'bg-slate-100 text-slate-400 ring-slate-200/80',
          ].join(' ')}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="flex shrink-0 flex-col items-end gap-1">{badge}</div>
      </div>
      <div className="min-w-0">
        <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </>
  )

  if (canNavigate) {
    return (
      <button
        type="button"
        onClick={() => onNavigate(navigateTo)}
        className="group flex w-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm shadow-slate-900/5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        {body}
        <span className="mt-3 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">
          Open module →
        </span>
      </button>
    )
  }

  return (
    <div
      role="group"
      aria-disabled="true"
      className="flex cursor-not-allowed flex-col rounded-2xl border border-dashed border-slate-200 bg-slate-50/90 p-5 opacity-60 shadow-none"
    >
      {body}
    </div>
  )
}
