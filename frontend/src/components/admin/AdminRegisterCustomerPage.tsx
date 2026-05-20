import { useState } from 'react'
import { CircleCheckBig, UserPlus } from 'lucide-react'
import { createCustomerWithVehicles } from '../../services/customerApi'

type Props = {
  onDone: () => void
}

export function AdminRegisterCustomerPage({ onDone }: Props) {
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function resetForm() {
    setCustomerName('')
    setPhone('')
    setAddress('')
    setVehicleNumber('')
    setVehicleType('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const parsedPhone = phone.replace(/[^\d+]/g, '')
    if (!/^\+?\d{10,12}$/.test(parsedPhone)) {
      setError('Please enter a valid phone number (10-12 digits, optional +).')
      return
    }

    setSaving(true)
    try {
      const vNum = vehicleNumber.trim().toUpperCase()
      const vType = vehicleType.trim()
      await createCustomerWithVehicles({
        name: customerName.trim(),
        phone: parsedPhone,
        address: address.trim(),
        vehicles: vNum
          ? [
              {
                vehicleNumber: vNum,
                brand: vType || 'Unknown',
                model: vType || 'Unknown',
                year: new Date().getFullYear(),
                mileage: 0,
              },
            ]
          : [],
      })

      setSuccess('Customer saved successfully. Redirecting to Manage Customers...')
      resetForm()
      window.setTimeout(() => onDone(), 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 bg-gray-100 p-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register Customer</h1>
        <p className="mt-1 text-sm text-slate-600">Add a new customer and vehicle details.</p>
      </header>

      {success ? (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CircleCheckBig className="h-4 w-4" />
          {success}
        </div>
      ) : null}
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="rounded-xl bg-white p-5 shadow-md">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-700">
            Customer Name
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
              placeholder="Full name"
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
              placeholder="Street, city"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Vehicle Number
              <input
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
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
                placeholder="Sedan / SUV"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {saving ? 'Saving…' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
