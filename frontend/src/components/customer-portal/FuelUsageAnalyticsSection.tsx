import { ChartBarIcon } from '@heroicons/react/24/outline'
import type { FuelUsageAnalytics } from '../../services/predictionApi'
import { formatDate } from './shared'

type Props = {
  analytics: FuelUsageAnalytics
  onOpenUpdateUsage: () => void
  disableUpdate?: boolean
}

export function FuelUsageAnalyticsSection({
  analytics,
  onOpenUpdateUsage,
  disableUpdate = false,
}: Props) {
  const odometerMiles = analytics.latestOdometerMiles

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-5 py-4 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Last Odometer
        </p>
        <p className="text-xl font-bold text-white sm:text-2xl">
          {odometerMiles > 0 ? odometerMiles.toLocaleString() : '—'} Miles
        </p>
      </header>

      <div className="min-h-[220px] bg-slate-50/40 px-5 py-10 sm:px-8 sm:py-12">
        {analytics.hasSufficientData ? (
          <div className="mx-auto max-w-lg">
            <div className="mb-6 flex items-center justify-center gap-2 text-emerald-700">
              <ChartBarIcon className="h-5 w-5" />
              <p className="text-sm font-semibold">Usage trends active — AI learning from your logs</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Total logs</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{analytics.totalLogCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Avg efficiency</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {analytics.avgMpg != null ? `${analytics.avgMpg} MPG` : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase text-slate-500">Last log</p>
                <p className="mt-1 text-xs font-semibold text-slate-900">
                  {analytics.lastLogDate ? formatDate(analytics.lastLogDate) : '—'}
                </p>
              </div>
            </div>
            {analytics.recentLogs.length > 0 ? (
              <ul className="mt-5 space-y-2">
                {analytics.recentLogs.slice(0, 3).map((log) => (
                  <li
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-800">{log.vehicleNumber}</span>
                    <span className="text-slate-500">
                      {log.odometerMiles.toLocaleString()} mi
                      {log.fuelAmountLiters > 0 ? ` · ${log.fuelAmountLiters}L` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onOpenUpdateUsage}
                disabled={disableUpdate}
                className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Update Usage
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
              <ChartBarIcon className="h-8 w-8" strokeWidth={1.5} />
            </span>
            <p className="mt-5 text-sm leading-relaxed text-slate-500">
              Insufficient data to generate predictions. Please log your mileage to start analyzing.
            </p>
            <button
              type="button"
              onClick={onOpenUpdateUsage}
              disabled={disableUpdate}
              className="mt-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Log Your Fuel Usage
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
