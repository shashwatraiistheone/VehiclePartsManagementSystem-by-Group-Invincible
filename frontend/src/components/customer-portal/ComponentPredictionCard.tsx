import type { ComponentPrediction } from '../../services/predictionApi'
import {
  cardSurfaceClass,
  formatComponentTitle,
  formatReplaceByDate,
  normalizeAiSeverity,
  progressBarClass,
  progressTrackClass,
  severityPillClass,
} from './maintenanceAiUtils'
import type { CustomerNavId } from './types'

type Props = {
  prediction: ComponentPrediction
  onNavigate: (navId: CustomerNavId) => void
}

const GRADIENT_BTN =
  'w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 hover:shadow-lg'

export function ComponentPredictionCard({ prediction, onNavigate }: Props) {
  const severity = normalizeAiSeverity(prediction.severity)
  const health = Math.min(100, Math.max(0, prediction.healthPercent))
  const milesLeft = prediction.estimatedMilesUntilService
  const needsAction = severity === 'CRITICAL' || severity === 'WARNING'
  const progressPct =
    milesLeft > 0 ? Math.min(100, Math.max(8, Math.round((milesLeft / 50000) * 100))) : 100

  return (
    <article
      className={[
        'flex h-full flex-col rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        cardSurfaceClass(severity),
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-bold tracking-wide text-slate-800">
          {formatComponentTitle(prediction.component)}
        </h4>
        <span
          className={[
            'shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
            severityPillClass(severity),
          ].join(' ')}
        >
          {severity}
        </span>
      </div>

      {milesLeft > 0 ? (
        <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {milesLeft.toLocaleString()}
          <span className="ml-1.5 text-sm font-semibold text-slate-600">miles left</span>
        </p>
      ) : (
        <p className="mt-4 text-lg font-bold text-red-700">Service due now</p>
      )}

      <div className="mt-3">
        <div className={['h-1.5 overflow-hidden rounded-full', progressTrackClass(severity)].join(' ')}>
          <div
            className={['h-full rounded-full transition-all', progressBarClass(severity)].join(' ')}
            style={{ width: severity === 'CRITICAL' ? `${Math.min(health, 35)}%` : `${progressPct}%` }}
          />
        </div>
      </div>

      {prediction.predictionDate ? (
        <p className="mt-3 text-xs font-semibold text-slate-700">
          Replace by {formatReplaceByDate(prediction.predictionDate)}
        </p>
      ) : null}

      <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">
        {prediction.recommendation || prediction.summary}
      </p>

      <p className="mt-3 text-[11px] font-medium text-slate-500">
        AI Confidence:{' '}
        <span className="font-bold text-slate-800">{prediction.confidencePercent}%</span>
      </p>

      <div className="mt-4 pt-1">
        {needsAction ? (
          <button type="button" onClick={() => onNavigate('book-service')} className={GRADIENT_BTN}>
            Schedule Service
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full cursor-default rounded-xl border border-emerald-200 bg-white/80 py-2.5 text-sm font-semibold text-emerald-800"
          >
            No Action Needed
          </button>
        )}
      </div>
    </article>
  )
}
