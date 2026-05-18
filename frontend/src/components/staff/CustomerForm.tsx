import { useMemo, useState } from 'react'
import type { Customer, CustomerInput } from './customerModule'

type Props = {
  title: string
  submitLabel: string
  initialValue?: Customer
  onSubmit: (value: CustomerInput) => void
  onReset?: () => void
}

function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, '')
}

export function CustomerForm({ title, submitLabel, initialValue, onSubmit, onReset }: Props) {
  const init = useMemo(
    () => ({
      name: initialValue?.name ?? '',
      phone: initialValue?.phone ?? '',
      address: initialValue?.address ?? '',
      vehicleNumber: initialValue?.vehicleNumber ?? '',
      vehicleType: initialValue?.vehicleType ?? '',
    }),
    [initialValue],
  )

  const [name, setName] = useState(init.name)
  const [phone, setPhone] = useState(init.phone)
  const [address, setAddress] = useState(init.address)
  const [vehicleNumber, setVehicleNumber] = useState(init.vehicleNumber)
  const [vehicleType, setVehicleType] = useState(init.vehicleType)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedPhone = normalizePhone(phone)
    if (!/^\+?\d{10,12}$/.test(parsedPhone)) {
      setError('Phone must be 10-12 digits (optional +).')
      return
    }
    setError(null)
    onSubmit({
      name: name.trim(),
      phone: parsedPhone,
      address: address.trim(),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType: vehicleType.trim(),
    })
  }

  function handleReset() {
    setName(init.name)
    setPhone(init.phone)
    setAddress(init.address)
    setVehicleNumber(init.vehicleNumber)
    setVehicleType(init.vehicleType)
    setError(null)
    onReset?.()
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {error ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Customer Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            placeholder="0771234567"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Address
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Vehicle Number
            <input
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              placeholder="WP-CA-1234"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Vehicle Type
            <input
              required
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              placeholder="Sedan"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
