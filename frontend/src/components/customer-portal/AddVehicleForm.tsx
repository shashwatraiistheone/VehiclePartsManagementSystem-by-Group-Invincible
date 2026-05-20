import { useEffect, useMemo, useState } from 'react'
import { TruckIcon } from '@heroicons/react/24/outline'
import {
  addVehicle,
  fetchVehicles,
  updateVehicle,
  type Vehicle,
  type VehicleInput,
} from '../../services/customerApi'
import { useToast } from '../ui/ToastProvider'
import { VehicleNumberCombobox } from './VehicleNumberCombobox'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15'
const labelClass = 'block text-xs font-semibold text-slate-600'

export const emptyVehicleForm = (): VehicleInput => ({
  vehicleNumber: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  mileage: 0,
  notes: '',
})

export type VehicleFormErrors = Partial<Record<keyof VehicleInput, string>>

export function validateVehicleForm(
  form: VehicleInput,
  existingVehicles: Vehicle[],
  editingVehicleId?: number | null,
): VehicleFormErrors {
  const errors: VehicleFormErrors = {}
  const yearMax = new Date().getFullYear() + 1

  if (!form.vehicleNumber.trim()) {
    errors.vehicleNumber = 'Vehicle number is required.'
  } else {
    const normalized = form.vehicleNumber.trim().toUpperCase()
    const duplicate = existingVehicles.some(
      (v) => v.vehicleNumber.toUpperCase() === normalized && v.id !== editingVehicleId,
    )
    if (duplicate) {
      errors.vehicleNumber = 'This vehicle number is already on your account.'
    }
  }

  if (!form.brand.trim()) errors.brand = 'Vehicle make is required.'
  if (!form.model.trim()) errors.model = 'Model is required.'

  if (!form.year || form.year < 1900 || form.year > yearMax) {
    errors.year = `Enter a valid year between 1900 and ${yearMax}.`
  }

  if (form.mileage < 0 || Number.isNaN(form.mileage)) {
    errors.mileage = 'Mileage must be zero or greater.'
  }

  return errors
}

type Props = {
  customerId: number
  vehicles: Vehicle[]
  editingVehicle?: Vehicle | null
  onSuccess: (vehicles: Vehicle[]) => void
  onCancel?: () => void
  variant?: 'page' | 'modal'
}

export function AddVehicleForm({
  customerId,
  vehicles,
  editingVehicle = null,
  onSuccess,
  onCancel,
  variant = 'page',
}: Props) {
  const { showToast } = useToast()
  const isEdit = editingVehicle != null
  const [form, setForm] = useState<VehicleInput>(() =>
    editingVehicle
      ? {
          vehicleNumber: editingVehicle.vehicleNumber,
          brand: editingVehicle.brand,
          model: editingVehicle.model,
          year: editingVehicle.year,
          mileage: editingVehicle.mileage,
          notes: editingVehicle.notes ?? '',
        }
      : emptyVehicleForm(),
  )
  const [errors, setErrors] = useState<VehicleFormErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof VehicleInput, boolean>>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingVehicle) {
      setForm({
        vehicleNumber: editingVehicle.vehicleNumber,
        brand: editingVehicle.brand,
        model: editingVehicle.model,
        year: editingVehicle.year,
        mileage: editingVehicle.mileage,
        notes: editingVehicle.notes ?? '',
      })
    }
  }, [editingVehicle])

  const existingNumbers = useMemo(
    () => vehicles.map((v) => v.vehicleNumber),
    [vehicles],
  )

  function validate(): boolean {
    const next = validateVehicleForm(form, vehicles, editingVehicle?.id ?? null)
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function touchField(field: keyof VehicleInput) {
    setTouched((t) => ({ ...t, [field]: true }))
    const next = validateVehicleForm(form, vehicles, editingVehicle?.id ?? null)
    setErrors(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({
      vehicleNumber: true,
      brand: true,
      model: true,
      year: true,
      mileage: true,
    })
    if (!validate()) return

    setSaving(true)
    try {
      const payload: VehicleInput = {
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year,
        mileage: form.mileage,
        notes: form.notes?.trim() || undefined,
      }

      if (isEdit && editingVehicle) {
        await updateVehicle(customerId, editingVehicle.id, payload)
        showToast('Vehicle updated successfully.', 'success')
      } else {
        await addVehicle(customerId, payload)
        showToast('Vehicle saved successfully.', 'success')
      }

      const updated = await fetchVehicles(customerId)
      onSuccess(updated)
      if (!isEdit) setForm(emptyVehicleForm())
      setErrors({})
      setTouched({})
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save vehicle', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showError = (field: keyof VehicleInput) => (touched[field] ? errors[field] : undefined)

  const card = (
    <div
      className={[
        'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50',
        variant === 'page' ? 'w-full max-w-lg' : 'w-full',
      ].join(' ')}
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 px-6 py-6 text-white">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <TruckIcon className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {isEdit ? 'Edit Your Vehicle' : 'Register Your Vehicle'}
            </h2>
            <p className="mt-1 text-sm text-blue-100/90">
              Manage your vehicles for appointments and service
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-6">
        <label className={labelClass}>
          Vehicle Make
          <input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            onBlur={() => touchField('brand')}
            className={[inputClass, showError('brand') ? 'border-red-300' : ''].join(' ')}
            placeholder="e.g. Toyota"
            disabled={saving}
          />
          {showError('brand') ? <p className="mt-1 text-xs text-red-600">{errors.brand}</p> : null}
        </label>

        <label className={labelClass}>
          Vehicle Number
          <VehicleNumberCombobox
            value={form.vehicleNumber}
            onChange={(vehicleNumber) => setForm({ ...form, vehicleNumber })}
            existingNumbers={existingNumbers}
            disabled={saving}
            error={showError('vehicleNumber')}
            onBlur={() => touchField('vehicleNumber')}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Model
            <input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              onBlur={() => touchField('model')}
              className={[inputClass, showError('model') ? 'border-red-300' : ''].join(' ')}
              placeholder="e.g. Corolla"
              disabled={saving}
            />
            {showError('model') ? <p className="mt-1 text-xs text-red-600">{errors.model}</p> : null}
          </label>

          <label className={labelClass}>
            Year
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              onBlur={() => touchField('year')}
              className={[inputClass, showError('year') ? 'border-red-300' : ''].join(' ')}
              min={1900}
              max={new Date().getFullYear() + 1}
              disabled={saving}
            />
            {showError('year') ? <p className="mt-1 text-xs text-red-600">{errors.year}</p> : null}
          </label>
        </div>

        <label className={labelClass}>
          Mileage (km)
          <input
            type="number"
            value={form.mileage}
            onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}
            onBlur={() => touchField('mileage')}
            className={[inputClass, showError('mileage') ? 'border-red-300' : ''].join(' ')}
            min={0}
            disabled={saving}
          />
          {showError('mileage') ? <p className="mt-1 text-xs text-red-600">{errors.mileage}</p> : null}
        </label>

        <label className={labelClass}>
          Description / Notes <span className="font-normal text-slate-400">(optional)</span>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Any details for your service advisor…"
            disabled={saving}
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Vehicle'}
        </button>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </form>
    </div>
  )

  if (variant === 'page') {
    return <div className="mx-auto flex w-full justify-center px-2 py-2">{card}</div>
  }

  return card
}
