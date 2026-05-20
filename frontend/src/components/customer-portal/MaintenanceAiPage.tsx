import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Vehicle } from '../../services/customerApi'
import { fetchMaintenanceDashboard, type MaintenanceDashboard } from '../../services/predictionApi'
import { MaintenanceAiToolbar } from './MaintenanceAiToolbar'
import { UpdateUsageModal } from './UpdateUsageModal'
import { fleetScoreBadgeClass, formatRelativeTime } from './maintenanceAiUtils'
import { VehicleMaintenancePanel } from './VehicleMaintenancePanel'
import type { CustomerNavId } from './types'

type Props = {
  vehicles: Vehicle[]
  onNavigate: (navId: CustomerNavId) => void
  displayName?: string
  onLogout?: () => void
  onLogin?: () => void
  onRegister?: () => void
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-28 rounded-2xl bg-slate-100" />
      <div className="h-64 rounded-2xl bg-slate-100" />
      <div className="h-64 rounded-2xl bg-slate-100" />
    </div>
  )
}

export function MaintenanceAiPage({
  vehicles,
  onNavigate,
  displayName,
  onLogout,
  onLogin,
  onRegister,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [dashboard, setDashboard] = useState<MaintenanceDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [usageModalOpen, setUsageModalOpen] = useState(false)
  const [usageVehicleId, setUsageVehicleId] = useState<number | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const data = await fetchMaintenanceDashboard()
      setDashboard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load maintenance insights')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const activeVehicles = useMemo(
    () => dashboard?.vehicles.filter((v) => v.vehicleId > 0) ?? [],
    [dashboard],
  )

  useEffect(() => {
    if (activeVehicles.length === 0) {
      setSelectedVehicleId(null)
      return
    }
    const fromUrl = Number(searchParams.get('vehicle'))
    const urlMatch = activeVehicles.find((v) => v.vehicleId === fromUrl)
    const nextId = urlMatch?.vehicleId ?? activeVehicles[0].vehicleId
    setSelectedVehicleId(nextId)
    if (!urlMatch) {
      setSearchParams({ vehicle: String(nextId) }, { replace: true })
    }
  }, [activeVehicles, searchParams, setSearchParams])

  function selectVehicle(vehicleId: number) {
    setSelectedVehicleId(vehicleId)
    setSearchParams({ vehicle: String(vehicleId) }, { replace: true })
  }

  function openUsageModal(vehicleId?: number) {
    const id = vehicleId ?? selectedVehicleId ?? vehicles[0]?.id ?? null
    setUsageVehicleId(id)
    setUsageModalOpen(true)
  }

  if (loading && !dashboard) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <DashboardSkeleton />
      </div>
    )
  }

  if (error && !dashboard) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
        {error}
        <button type="button" onClick={() => void load()} className="ml-3 font-semibold underline">
          Retry
        </button>
      </div>
    )
  }

  if (!dashboard) return null

  const score = dashboard.fleetHealthScore
  const selectedVehicle =
    activeVehicles.find((v) => v.vehicleId === selectedVehicleId) ?? activeVehicles[0] ?? null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Predictive Maintenance Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            AI Maintenance Insights
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Predictive maintenance analysis based on your driving patterns and service history.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatRelativeTime(dashboard.generatedAt)}
            {refreshing ? ' · Refreshing predictions…' : null}
          </p>
        </div>

        <div
          className={[
            'inline-flex shrink-0 items-center gap-2 self-start rounded-2xl px-4 py-3 ring-1 ring-inset',
            fleetScoreBadgeClass(score),
          ].join(' ')}
        >
          <span className="text-xs font-semibold uppercase tracking-wide">Fleet Health Score</span>
          <span className="text-2xl font-bold">{score}%</span>
        </div>
      </header>

      <MaintenanceAiToolbar
        vehicles={activeVehicles}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={selectVehicle}
        onLogUsage={() => openUsageModal()}
        displayName={displayName}
        onLogin={onLogin}
        onRegister={onRegister}
        onLogout={onLogout}
        logUsageDisabled={vehicles.length === 0}
      />

      {activeVehicles.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-sm text-slate-600">Register a vehicle to unlock AI maintenance predictions.</p>
          <button
            type="button"
            onClick={() => onNavigate('add-vehicle')}
            className="mt-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            Add Vehicle
          </button>
        </section>
      ) : selectedVehicle ? (
        <VehicleMaintenancePanel
          vehicle={selectedVehicle}
          onNavigate={onNavigate}
          onOpenUpdateUsage={() => openUsageModal(selectedVehicle.vehicleId)}
        />
      ) : null}

      <UpdateUsageModal
        open={usageModalOpen}
        vehicles={vehicles}
        initialVehicleId={usageVehicleId}
        onClose={() => setUsageModalOpen(false)}
        onSuccess={() => void load(true)}
      />
    </div>
  )
}
