import { CpuChipIcon, UserCircleIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import type { MaintenancePrediction } from '../../services/predictionApi'
import {
  mapPredictionSeverity,
  predictionDetailLine,
  severityBadgeClass,
} from './dashboardPredictionUtils'

type Props = {
  customerName: string
  predictions: MaintenancePrediction[]
  loyaltyBadge?: string | null
  loading?: boolean
  error?: string | null
}

function PredictionSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  )
}

export function DashboardTopSection({
  customerName,
  predictions,
  loyaltyBadge,
  loading = false,
  error,
}: Props) {
  const displayName = customerName.trim() || 'Customer'

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 shadow-lg shadow-slate-900/25">
      {/* Welcome banner */}
      <div className="flex items-center gap-4 px-5 py-5 sm:gap-5 sm:px-7 sm:py-6">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-500/20 ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/30 sm:h-16 sm:w-16"
          aria-hidden
        >
          <UserCircleIcon className="h-8 w-8 text-blue-300 sm:h-9 sm:w-9" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
            Welcome, {displayName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-300 sm:text-[15px]">
            Your vehicle&apos;s health starts here.
          </p>
          {loyaltyBadge ? (
            <span className="mt-2 inline-flex rounded-full bg-gradient-to-r from-amber-400/90 to-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 sm:hidden">
              {loyaltyBadge}
            </span>
          ) : null}
        </div>
        {loyaltyBadge ? (
          <span className="hidden shrink-0 rounded-full bg-gradient-to-r from-amber-400/90 to-amber-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-md shadow-amber-500/25 sm:inline-flex">
            {loyaltyBadge}
          </span>
        ) : null}
      </div>

      {/* AI maintenance predictions */}
      <div className="border-t border-white/10 bg-slate-950/50 px-5 py-4 sm:px-7 sm:py-5">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 ring-1 ring-blue-400/30">
            <CpuChipIcon className="h-5 w-5 text-blue-300" aria-hidden />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-white sm:text-base">
            AI Maintenance Prediction
          </h2>
        </div>

        {loading ? (
          <PredictionSkeleton />
        ) : error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
            {error}
          </p>
        ) : predictions.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-400">
            Add a vehicle with current mileage to receive personalized maintenance alerts.
          </p>
        ) : (
          <ul className="space-y-2">
            {predictions.slice(0, 4).map((p, i) => {
              const severity = mapPredictionSeverity(p.riskLevel)
              const detail = predictionDetailLine(p)
              return (
                <li
                  key={`${p.component}-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 sm:px-3.5 sm:py-3"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-300">
                    <WrenchScrewdriverIcon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium leading-snug text-slate-100 sm:text-sm">
                      <span className="text-slate-300">{p.component}: </span>
                      {p.recommendation}
                    </p>
                    {detail ? (
                      <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>
                    ) : null}
                  </div>
                  <span
                    className={[
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      severityBadgeClass(severity),
                    ].join(' ')}
                  >
                    {severity}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
