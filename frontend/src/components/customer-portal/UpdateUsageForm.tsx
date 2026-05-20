import { useEffect, useMemo, useState } from 'react'
import { SignalIcon } from '@heroicons/react/24/outline'
import type { Vehicle } from '../../services/customerApi'
import { kmToMiles, milesToKm, updateVehicleUsage } from '../../services/fuelUsageApi'
import { useToast } from '../ui/ToastProvider'

export const VEHICLE_CONDITION_OPTIONS = [
  { value: 'good', label: 'Good - Running smoothly' },
  { value: 'minor', label: 'Minor issues' },
  { value: 'inspection', label: 'Needs inspection' },
  { value: 'poor', label: 'Poor condition' },
] as const

type Props = {
  vehicles: Vehicle[]
  initialVehicleId?: number | null
  onBack: () => void
  onSuccess: () => void
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15'

function vehicleLabel(v: Vehicle): string {
  return `${v.year} ${v.brand} ${v.model}`
}

function conditionToNotes(value: string): string {
  const opt = VEHICLE_CONDITION_OPTIONS.find((o) => o.value === value)
  return opt?.label ?? value
}

export function UpdateUsageForm({ vehicles, initialVehicleId, onBack, onSuccess }: Props) {
  const { showToast } = useToast()
  const [vehicleId, setVehicleId] = useState<number>(0)
  const [odometerMiles, setOdometerMiles] = useState('')
  const [condition, setCondition] = useState<string>('good')
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ odometer?: string; vehicle?: string }>({})

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId],
  )

  const minOdometerMiles = selectedVehicle ? kmToMiles(selectedVehicle.mileage) : 0

  useEffect(() => {
    if (vehicles.length === 0) return
    const initial =
      initialVehicleId && vehicles.some((v) => v.id === initialVehicleId)
        ? initialVehicleId
        : vehicles[0].id
    setVehicleId(initial)
    const v = vehicles.find((x) => x.id === initial)!
    setOdometerMiles(String(kmToMiles(v.mileage) || ''))
    setCondition('good')
  }, [vehicles, initialVehicleId])

  function validate(): boolean {
    const next: { odometer?: string; vehicle?: string } = {}
    if (!vehicleId) next.vehicle = 'Select a vehicle.'
    const miles = Number(odometerMiles.replace(/,/g, ''))
    if (!Number.isFinite(miles) || miles <= 0) {
      next.odometer = 'Enter a valid odometer reading.'
    } else if (miles < minOdometerMiles) {
      next.odometer = `Odometer cannot be less than ${minOdometerMiles.toLocaleString()} miles.`
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const miles = Number(odometerMiles.replace(/,/g, ''))
    setSaving(true)
    try {
      await updateVehicleUsage({
        vehicleId,
        odometerKm: milesToKm(miles),
        conditionNotes: conditionToNotes(condition),
      })
      showToast('Usage updated. AI predictions refreshed.', 'success')
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed'
      setFieldErrors({ odometer: msg })
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <p className="text-sm text-slate-600">Register a vehicle before updating usage.</p>
        <button type="button" onClick={onBack} className="mt-4 text-sm font-medium text-blue-600 hover:underline">
          ← Back to Maintenance
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md px-1">
      <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-5 py-4 sm:px-6">
          <h1 className="text-base font-bold text-white sm:text-lg">Update Usage</h1>
          <p className="text-right text-xs font-medium text-blue-100 sm:text-sm">
            Vehicle:{' '}
            <span className="text-white">{selectedVehicle ? vehicleLabel(selectedVehicle) : '—'}</span>
          </p>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
          {vehicles.length > 1 ? (
            <label className="block text-sm font-semibold text-slate-700">
              Select vehicle
              <select
                value={vehicleId}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  setVehicleId(id)
                  const v = vehicles.find((x) => x.id === id)
                  if (v) setOdometerMiles(String(kmToMiles(v.mileage) || ''))
                  setFieldErrors({})
                }}
                className={inputClass}
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleLabel(v)} ({v.vehicleNumber})
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-semibold text-slate-700">
            Current Odometer Reading (Miles)
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SignalIcon className="h-4 w-4" aria-hidden />
              </span>
              <input
                type="number"
                min={minOdometerMiles}
                required
                value={odometerMiles}
                onChange={(e) => {
                  setOdometerMiles(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, odometer: undefined }))
                }}
                className={`${inputClass} pl-9`}
                placeholder="171182"
              />
            </div>
            {fieldErrors.odometer ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.odometer}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Minimum: {minOdometerMiles.toLocaleString()} miles
              </p>
            )}
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            General Vehicle Condition
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className={inputClass}
            >
              {VEHICLE_CONDITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Updating…' : 'Update & Predict'}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="mx-auto block text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            ← Back to Maintenance
          </button>
        </form>
      </article>
    </div>
  )
}
