import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { persistAuthSession } from '../lib/auth'
import { registerCustomer } from '../services/authApi'
import { extractApiErrorMessage } from '../lib/apiClient'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthToast } from '../components/auth/AuthToast'
import { PasswordInput } from '../components/auth/PasswordInput'

const inputClass =
  'w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15'

export default function CustomerRegister(props: {
  onRegistered: (role: string) => void
  onBackToLogin: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [mileage, setMileage] = useState('0')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (!vehicleNumber.trim() || !brand.trim() || !model.trim()) {
      setError('Vehicle number, brand, and model are required.')
      return
    }

    const yearNum = Number(year)
    const currentYear = new Date().getFullYear()
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      setError(`Enter a valid vehicle year (1900–${currentYear + 1}).`)
      return
    }

    const mileageNum = Number(mileage)
    if (!Number.isFinite(mileageNum) || mileageNum < 0) {
      setError('Mileage cannot be negative.')
      return
    }

    setLoading(true)
    try {
      const vehicles = [
        {
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          brand: brand.trim(),
          model: model.trim(),
          year: yearNum,
          mileage: mileageNum,
        },
      ]

      const res = await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        address: address.trim(),
        vehicles,
      })
      persistAuthSession({
        token: res.token,
        userId: res.userId,
        name: res.name,
        role: res.role,
      })
      props.onRegistered(res.role)
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      brandSubtitle="Create your customer account to track purchases, service history, and appointments."
    >
      <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-xl shadow-slate-900/[0.04] sm:p-10">
        <div className="mb-6">
          <span className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
            Customer only
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Customer Registration</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Register to access your customer portal. Admin and staff accounts cannot be created
            here—they are provisioned internally by your store.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="reg-name" className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Jane Smith"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@email.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="mb-2 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              placeholder="+1 555 000 0000"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="reg-address" className="mb-2 block text-sm font-medium text-slate-700">
              Address <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="reg-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              placeholder="123 Main St"
              className={inputClass}
            />
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Vehicle details <span className="text-red-500">*</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-vehicle-number" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Vehicle number
                </label>
                <input
                  id="reg-vehicle-number"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  required
                  placeholder="BA 1 PA 1234"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="reg-brand" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Brand
                </label>
                <input
                  id="reg-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  placeholder="Toyota"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="reg-model" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Model
                </label>
                <input
                  id="reg-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  placeholder="Corolla"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="reg-year" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Year
                </label>
                <input
                  id="reg-year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  placeholder="Year"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="reg-mileage" className="mb-1.5 block text-xs font-medium text-slate-600">
                  Mileage (km)
                </label>
                <input
                  id="reg-mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  required
                  min={0}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <PasswordInput
              id="reg-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label htmlFor="reg-confirm" className="mb-2 block text-sm font-medium text-slate-700">
              Confirm password
            </label>
            <PasswordInput
              id="reg-confirm"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              required
            />
          </div>

          {error ? <AuthToast message={error} variant="error" onDismiss={() => setError(null)} /> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-500 hover:to-blue-400 disabled:opacity-65"
          >
            {loading ? (
              <>
                <ArrowPathIcon className="h-5 w-5 animate-spin" aria-hidden />
                Creating account…
              </>
            ) : (
              'Create customer account'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={props.onBackToLogin}
            className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
