import { useState, type ReactNode } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchVehicleNumberSuggestions, registerCustomer } from '../../services/customerApi'
import { staffPath } from '../../staff/staffRoutes'
import { useToast } from '../ui/ToastProvider'

const INPUT_CLASS =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25'
const INPUT_ERROR_CLASS =
  'mt-1.5 w-full rounded-lg border border-rose-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25'

type FieldKey =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'address'
  | 'vehicleNumber'
  | 'make'
  | 'model'
  | 'year'
  | 'vin'

type FieldErrors = Partial<Record<FieldKey, string>>

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
      <span className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-600 to-indigo-500" aria-hidden />
      {children}
    </h3>
  )
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function isValidPhone(value: string) {
  const parsed = value.replace(/[^\d+]/g, '')
  return /^\+?\d{10,12}$/.test(parsed)
}

function mapApiError(message: string): FieldErrors {
  const lower = message.toLowerCase()
  if (lower.includes('email') && (lower.includes('exist') || lower.includes('duplicate'))) {
    return { email: message }
  }
  if (lower.includes('vehicle number') || lower.includes('license plate') || lower.includes('plate')) {
    return { vehicleNumber: message }
  }
  return {}
}

export function StaffRegisterCustomerPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vin, setVin] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [checkingPlate, setCheckingPlate] = useState(false)

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!firstName.trim()) next.firstName = 'First name is required.'
    if (!lastName.trim()) next.lastName = 'Last name is required.'
    if (!email.trim()) next.email = 'Email is required.'
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address.'
    if (!phone.trim()) next.phone = 'Phone is required.'
    else if (!isValidPhone(phone)) next.phone = 'Enter a valid phone number (10–12 digits).'
    if (!vehicleNumber.trim()) next.vehicleNumber = 'Vehicle number / license plate is required.'
    if (year.trim()) {
      const yearNum = Number(year)
      if (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        next.year = `Enter a year between 1900 and ${new Date().getFullYear() + 1}.`
      }
    }
    if (vin.trim() && vin.trim().length < 11) {
      next.vin = 'VIN should be at least 11 characters when provided.'
    }
    return next
  }

  async function checkDuplicatePlate(plate: string) {
    const normalized = plate.trim().toUpperCase()
    if (normalized.length < 2) return
    setCheckingPlate(true)
    try {
      const suggestions = await fetchVehicleNumberSuggestions(normalized)
      if (suggestions.some((s) => s.toUpperCase() === normalized)) {
        setErrors((prev) => ({
          ...prev,
          vehicleNumber: 'This vehicle number is already registered.',
        }))
      }
    } catch {
      /* ignore suggestion lookup failures */
    } finally {
      setCheckingPlate(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const parsedPhone = phone.replace(/[^\d+]/g, '')
    const plate = vehicleNumber.trim().toUpperCase()
    const yearNum = year.trim() ? Number(year) : undefined

    setSaving(true)
    try {
      await registerCustomer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: parsedPhone,
        address: address.trim(),
        vehicle: {
          licensePlate: plate,
          make: make.trim() || undefined,
          model: model.trim() || undefined,
          year: yearNum,
          vin: vin.trim() || undefined,
        },
      })
      showToast('Customer registered successfully', 'success')
      navigate(staffPath('manage-customers'))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      const mapped = mapApiError(message)
      if (Object.keys(mapped).length > 0) {
        setErrors((prev) => ({ ...prev, ...mapped }))
      } else {
        showToast(message, 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 pb-8 sm:px-0">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register Customer</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a new customer profile and their first vehicle to the system.
        </p>
      </header>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/50 ring-1 ring-slate-100"
      >
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-5 text-white shadow-inner sm:px-8 sm:py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 shadow-sm">
              <UserPlus className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Customer Registration</h2>
              <p className="mt-0.5 text-sm text-blue-100">
                Complete both sections to register the customer and initial vehicle
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          <section className="space-y-5 border-b border-slate-100 p-6 sm:p-8 md:border-b-0 md:border-r">
            <SectionTitle>Customer Details</SectionTitle>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First Name" required error={errors.firstName}>
                <input
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    setErrors((prev) => ({ ...prev, firstName: undefined }))
                  }}
                  className={errors.firstName ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  autoComplete="given-name"
                  placeholder="John"
                />
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <input
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    setErrors((prev) => ({ ...prev, lastName: undefined }))
                  }}
                  className={errors.lastName ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  autoComplete="family-name"
                  placeholder="Smith"
                />
              </Field>
            </div>

            <Field label="Email" required error={errors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((prev) => ({ ...prev, email: undefined }))
                }}
                className={errors.email ? INPUT_ERROR_CLASS : INPUT_CLASS}
                autoComplete="email"
                placeholder="customer@email.com"
              />
            </Field>

            <Field label="Phone" required error={errors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                className={errors.phone ? INPUT_ERROR_CLASS : INPUT_CLASS}
                autoComplete="tel"
                placeholder="+1 555 123 4567"
              />
            </Field>

            <Field label="Address" error={errors.address}>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={5}
                className={`${errors.address ? INPUT_ERROR_CLASS : INPUT_CLASS} min-h-[120px] resize-y`}
                autoComplete="street-address"
                placeholder="Street address, city, state, ZIP"
              />
            </Field>
          </section>

          <section className="space-y-5 p-6 sm:p-8">
            <SectionTitle>Initial Vehicle Details</SectionTitle>

            <Field label="Vehicle Number / License Plate" required error={errors.vehicleNumber}>
              <input
                value={vehicleNumber}
                onChange={(e) => {
                  setVehicleNumber(e.target.value.toUpperCase())
                  setErrors((prev) => ({ ...prev, vehicleNumber: undefined }))
                }}
                onBlur={() => void checkDuplicatePlate(vehicleNumber)}
                className={`${errors.vehicleNumber ? INPUT_ERROR_CLASS : INPUT_CLASS} uppercase tracking-wide`}
                placeholder="ABC-1234"
              />
              {checkingPlate ? (
                <p className="mt-1.5 text-xs text-slate-400">Checking plate availability…</p>
              ) : null}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Make" error={errors.make}>
                <input
                  value={make}
                  onChange={(e) => {
                    setMake(e.target.value)
                    setErrors((prev) => ({ ...prev, make: undefined }))
                  }}
                  className={errors.make ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  placeholder="e.g. Toyota"
                />
              </Field>
              <Field label="Model" error={errors.model}>
                <input
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value)
                    setErrors((prev) => ({ ...prev, model: undefined }))
                  }}
                  className={errors.model ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  placeholder="e.g. Camry"
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Year" error={errors.year}>
                <input
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value)
                    setErrors((prev) => ({ ...prev, year: undefined }))
                  }}
                  className={errors.year ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  placeholder={String(new Date().getFullYear())}
                />
              </Field>
              <Field label="VIN (Optional)" error={errors.vin}>
                <input
                  value={vin}
                  onChange={(e) => {
                    setVin(e.target.value.toUpperCase())
                    setErrors((prev) => ({ ...prev, vin: undefined }))
                  }}
                  maxLength={17}
                  className={`${errors.vin ? INPUT_ERROR_CLASS : INPUT_CLASS} uppercase`}
                  placeholder="17-character VIN"
                />
              </Field>
            </div>

            <p className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-relaxed text-slate-600">
              You can add additional vehicles to this customer profile after completing initial
              registration.
            </p>
          </section>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-5 sm:flex-row sm:items-center sm:px-8">
          <button
            type="button"
            onClick={() => navigate(staffPath('manage-customers'))}
            disabled={saving}
            className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Complete Registration
          </button>
        </div>
      </form>
    </div>
  )
}
