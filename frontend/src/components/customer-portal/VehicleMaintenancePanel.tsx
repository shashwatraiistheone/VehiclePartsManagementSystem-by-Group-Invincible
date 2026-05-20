import { ChartBarIcon } from '@heroicons/react/24/outline'
import type { VehicleMaintenanceDashboard } from '../../services/predictionApi'
import { ComponentPredictionCard } from './ComponentPredictionCard'
import type { CustomerNavId } from './types'

type Props = {
  vehicle: VehicleMaintenanceDashboard
  onNavigate: (navId: CustomerNavId) => void
  onOpenUpdateUsage: () => void
}

const DASHBOARD_COMPONENT_ORDER = ['brake', 'oil filter', 'battery']

function pickDashboardComponents(vehicle: VehicleMaintenanceDashboard) {
  const picked: typeof vehicle.components = []
  for (const key of DASHBOARD_COMPONENT_ORDER) {
    const match = vehicle.components.find((c) => c.component.toLowerCase().includes(key))
    if (match) picked.push(match)
  }
  if (picked.length >= 3) return picked.slice(0, 3)
  const rest = vehicle.components.filter((c) => !picked.includes(c))
  return [...picked, ...rest].slice(0, 3)
}

export function VehicleMaintenancePanel({ vehicle, onNavigate, onOpenUpdateUsage }: Props) {
  const vehicleTitle = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`
  const showPredictions = vehicle.hasUsageData && vehicle.components.length > 0
  const displayComponents = pickDashboardComponents(vehicle)

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/30">
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-200 sm:text-base">
            Last Odometer:{' '}
            <span className="text-lg font-bold text-white sm:text-2xl">
              {vehicle.mileageMiles > 0 ? vehicle.mileageMiles.toLocaleString() : '—'} Miles
            </span>
          </p>
          <button
            type="button"
            onClick={onOpenUpdateUsage}
            className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:from-blue-600 hover:to-indigo-700 sm:text-sm"
          >
            Log Your Usage
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          {vehicleTitle} · {vehicle.vehicleNumber}
        </p>
      </header>

      <div className="bg-slate-50/80 p-4 sm:p-6">
        {showPredictions ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayComponents.map((c) => (
              <li key={c.component} className="min-h-[280px]">
                <ComponentPredictionCard prediction={c} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center px-4 py-10 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
              <ChartBarIcon className="h-10 w-10" strokeWidth={1.25} />
            </span>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-600">
              Insufficient data to generate predictions. Please log your mileage to start analyzing.
            </p>
            <button
              type="button"
              onClick={onOpenUpdateUsage}
              className="mt-6 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700"
            >
              Log Your Usage
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
