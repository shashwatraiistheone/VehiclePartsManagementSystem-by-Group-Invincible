import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { VehicleMaintenanceDashboard } from '../../services/predictionApi'

type Props = {
  vehicles: VehicleMaintenanceDashboard[]
  selectedVehicleId: number | null
  onSelectVehicle: (vehicleId: number) => void
  onLogUsage: () => void
  displayName?: string
  onLogin?: () => void
  onRegister?: () => void
  onLogout?: () => void
  logUsageDisabled?: boolean
}

function vehicleOptionLabel(v: VehicleMaintenanceDashboard): string {
  return `${v.year} ${v.brand} ${v.model} · ${v.vehicleNumber}`
}

export function MaintenanceAiToolbar({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  onLogUsage,
  displayName,
  onLogin,
  onRegister,
  onLogout,
  logUsageDisabled = false,
}: Props) {
  const isSignedIn = Boolean(onLogout)
  const hasVehicles = vehicles.length > 0

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-col gap-1.5 sm:min-w-[240px] sm:flex-1 sm:max-w-md">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Choose vehicle
          </span>
          <span className="relative">
            <select
              value={selectedVehicleId ?? ''}
              onChange={(e) => onSelectVehicle(Number(e.target.value))}
              disabled={!hasVehicles}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!hasVehicles ? (
                <option value="">No vehicles registered</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {vehicleOptionLabel(v)}
                  </option>
                ))
              )}
            </select>
            <ChevronDownIcon
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
          </span>
        </label>

        <button
          type="button"
          onClick={onLogUsage}
          disabled={logUsageDisabled || !hasVehicles}
          className="shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end"
        >
          Log Your Usage
        </button>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        {isSignedIn ? (
          <>
            {displayName ? (
              <span className="hidden text-sm text-slate-600 sm:inline">
                Signed in as <span className="font-semibold text-slate-900">{displayName}</span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            {onLogin ? (
              <button
                type="button"
                onClick={onLogin}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Login
              </button>
            ) : null}
            {onRegister ? (
              <button
                type="button"
                onClick={onRegister}
                className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700"
              >
                Sign up free
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}