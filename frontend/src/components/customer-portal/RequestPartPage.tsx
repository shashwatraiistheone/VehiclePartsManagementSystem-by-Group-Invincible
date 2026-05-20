import { useState } from 'react'
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import type { Vehicle } from '../../services/customerApi'
import { createPartRequest, fetchMyPartRequests, type PartRequest } from '../../services/partRequestApi'
import { useToast } from '../ui/ToastProvider'
import type { CustomerNavId } from './types'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15'
const labelClass = 'block text-xs font-semibold text-slate-600'

type FieldErrors = {
  partName?: string
  quantity?: string
}

type Props = {
  vehicles: Vehicle[]
  onRequestsChange: (requests: PartRequest[]) => void
  onNavigate: (navId: CustomerNavId) => void
}

function vehicleOptionLabel(v: Vehicle): string {
  return `${v.brand} ${v.model} (${v.vehicleNumber})`
}

export function RequestPartPage({ vehicles, onRequestsChange, onNavigate }: Props) {
  const { showToast } = useToast()
  const [partName, setPartName] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!partName.trim()) {
      next.partName = 'Part name is required.'
    } else if (partName.trim().length < 2) {
      next.partName = 'Part name must be at least 2 characters.'
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      next.quantity = 'Quantity must be at least 1.'
    }
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) {
      const first = Object.values(validation)[0]
      if (first) showToast(first, 'error')
      return
    }

    const vehicle = vehicles.find((v) => String(v.id) === vehicleId)
    const vehicleDetails = vehicle ? vehicleOptionLabel(vehicle) : ''

    setSubmitting(true)
    try {
      await createPartRequest({
        partName: partName.trim(),
        vehicleId: vehicle ? vehicle.id : undefined,
        vehicleDetails: vehicleDetails || undefined,
        description: description.trim() || undefined,
        quantity,
      })
      const list = await fetchMyPartRequests()
      onRequestsChange(list)
      showToast('Part request submitted successfully.', 'success')
      setPartName('')
      setVehicleId('')
      setDescription('')
      setQuantity(1)
      setErrors({})
      onNavigate('my-part-requests')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit request', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-1 py-2 sm:px-0">
      <article className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50">
        <header className="border-b border-slate-100 px-6 py-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <WrenchScrewdriverIcon className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Source a Part</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Can&apos;t find what you need? Tell us, and we&apos;ll source it for you
          </p>
        </header>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 px-6 py-6" noValidate>
          <div>
            <label className={labelClass} htmlFor="part-name">
              Part Name
            </label>
            <input
              id="part-name"
              type="text"
              value={partName}
              onChange={(e) => {
                setPartName(e.target.value)
                setErrors((prev) => ({ ...prev, partName: undefined }))
              }}
              className={`${inputClass} ${errors.partName ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15' : ''}`}
              placeholder="e.g. Brake pads, AC compressor belt"
              autoComplete="off"
            />
            {errors.partName ? (
              <p className="mt-1 text-xs text-red-600">{errors.partName}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="related-vehicle">
              Related Vehicle <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <select
              id="related-vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className={inputClass}
            >
              <option value="">No vehicle selected</option>
              {vehicles.map((v) => (
                <option key={v.id} value={String(v.id)}>
                  {vehicleOptionLabel(v)}
                </option>
              ))}
            </select>
          </div>

          <label className={labelClass} htmlFor="part-description">
            Description
            <textarea
              id="part-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`${inputClass} resize-none`}
              placeholder="Part specifications, preferred brand, issue details…"
            />
          </label>

          <div>
            <label className={labelClass} htmlFor="part-quantity">
              Quantity
            </label>
            <input
              id="part-quantity"
              type="number"
              min={1}
              max={9999}
              step={1}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                setQuantity(Number.isNaN(val) ? 0 : val)
                setErrors((prev) => ({ ...prev, quantity: undefined }))
              }}
              className={`${inputClass} ${errors.quantity ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15' : ''}`}
            />
            {errors.quantity ? (
              <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </article>
    </div>
  )
}
