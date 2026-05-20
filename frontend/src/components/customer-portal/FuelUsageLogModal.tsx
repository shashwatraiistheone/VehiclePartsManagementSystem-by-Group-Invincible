import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Vehicle } from '../../services/customerApi'
import { createFuelUsageLog, milesToKm } from '../../services/fuelUsageApi'
import { useToast } from '../ui/ToastProvider'

const FUEL_TYPES = ['Petrol', 'Diesel', 'Premium', 'Electric'] as const

type Props = {
  open: boolean
  vehicles: Vehicle[]
  onClose: () => void
  onSaved: () => void
}

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15'

export function FuelUsageLogModal({ open, vehicles, onClose, onSaved }: Props) {
  const { showToast } = useToast()
  const [vehicleId, setVehicleId] = useState<number>(0)
  const [odometerMiles, setOdometerMiles] = useState('')
  const [fuelAmount, setFuelAmount] = useState('')
  const [fuelType, setFuelType] = useState<string>(FUEL_TYPES[0])
  const [fuelCost, setFuelCost] = useState('')
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && vehicles.length > 0) {
      setVehicleId(vehicles[0].id)
      setOdometerMiles(String(Math.round(vehicles[0].mileage * 0.621371)))
    }
  }, [open, vehicles])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const miles = Number(odometerMiles)
    const liters = Number(fuelAmount)
    const cost = Number(fuelCost)
    if (!vehicleId || !Number.isFinite(miles) || miles <= 0) {
      showToast('Enter a valid odometer reading.', 'error')
      return
    }
    if (!Number.isFinite(liters) || liters <= 0) {
      showToast('Enter a valid fuel amount.', 'error')
      return
    }

    setSaving(true)
    try {
      await createFuelUsageLog({
        vehicleId,
        odometerKm: milesToKm(miles),
        fuelAmountLiters: liters,
        fuelType,
        fuelCost: Number.isFinite(cost) ? cost : 0,
        logDate: logDate ? new Date(logDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
      })
      showToast('Fuel usage logged successfully.', 'success')
      onSaved()
      onClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save log', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fuel-log-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="fuel-log-title" className="text-lg font-bold text-slate-900">
            Log Fuel Usage
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-sm text-slate-600">Register a vehicle before logging fuel usage.</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <label className="block text-xs font-semibold text-slate-600">
              Vehicle
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(Number(e.target.value))}
                className={inputClass}
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.vehicleNumber})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Odometer (miles)
              <input
                type="number"
                min={1}
                required
                value={odometerMiles}
                onChange={(e) => setOdometerMiles(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-slate-600">
                Fuel amount (L)
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  required
                  value={fuelAmount}
                  onChange={(e) => setFuelAmount(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Fuel cost (Rs)
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={fuelCost}
                  onChange={(e) => setFuelCost(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-600">
              Fuel type
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className={inputClass}
              >
                {FUEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Date
              <input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Notes <span className="font-normal text-slate-400">(optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Log'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
