import { useEffect, useState } from 'react'
import { KeyIcon, PencilIcon, PlusIcon, TrashIcon, TruckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import {
  changeCustomerPassword,
  deleteVehicle,
  fetchVehicles,
  updateCustomerProfile,
  type CustomerDetail,
  type Vehicle,
} from '../../services/customerApi'
import { useToast } from '../ui/ToastProvider'
import { AddVehicleForm } from './AddVehicleForm'
import { EmptyState } from './shared'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15'
const labelClass = 'block text-xs font-medium text-slate-500'

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

type Props = {
  customerId: number
  profile: CustomerDetail
  vehicles: Vehicle[]
  onUpdated: (p: CustomerDetail) => void
  onVehiclesChange: (v: Vehicle[]) => void
}

export function ProfileSection({
  customerId,
  profile,
  vehicles: vehiclesProp,
  onUpdated,
  onVehiclesChange,
}: Props) {
  const { showToast } = useToast()
  const parsed = splitName(profile.name)
  const [firstName, setFirstName] = useState(parsed.firstName)
  const [lastName, setLastName] = useState(parsed.lastName)
  const [phone, setPhone] = useState(profile.phone)
  const [address, setAddress] = useState(profile.address)
  const [savingProfile, setSavingProfile] = useState(false)

  const [vehicles, setVehicles] = useState(vehiclesProp)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    const p = splitName(profile.name)
    setFirstName(p.firstName)
    setLastName(p.lastName)
    setPhone(profile.phone)
    setAddress(profile.address)
  }, [profile])

  useEffect(() => {
    setVehicles(vehiclesProp)
  }, [vehiclesProp])

  async function refreshVehicles() {
    const list = await fetchVehicles(customerId)
    setVehicles(list)
    onVehiclesChange(list)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    const name = joinName(firstName, lastName)
    if (!name || name.length < 2) {
      showToast('Please enter your first and last name.', 'error')
      return
    }
    setSavingProfile(true)
    try {
      const updated = await updateCustomerProfile(customerId, { name, phone, address })
      onUpdated(updated)
      showToast('Profile saved successfully.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      showToast('New passwords do not match.', 'error')
      return
    }
    if (newPw.length < 6) {
      showToast('Password must be at least 6 characters.', 'error')
      return
    }
    setSavingPassword(true)
    try {
      await changeCustomerPassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setShowPasswordModal(false)
      showToast('Password updated successfully.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Password change failed', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  function openAddVehicle() {
    setEditingVehicle(null)
    setShowVehicleForm(true)
  }

  function openEditVehicle(v: Vehicle) {
    setEditingVehicle(v)
    setShowVehicleForm(true)
  }

  function closeVehicleForm() {
    setShowVehicleForm(false)
    setEditingVehicle(null)
  }

  function handleVehicleFormSuccess(updated: Vehicle[]) {
    setVehicles(updated)
    onVehiclesChange(updated)
    closeVehicleForm()
  }

  async function handleDeleteVehicle(id: number) {
    if (!window.confirm('Remove this vehicle from your account?')) return
    try {
      await deleteVehicle(customerId, id)
      await refreshVehicles()
      showToast('Vehicle removed.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your personal details and registered vehicles.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* —— Left: Profile Details —— */}
        <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Profile Details</h2>
          </div>
          <form onSubmit={(e) => void saveProfile(e)} className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                First Name
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  required
                  minLength={1}
                />
              </label>
              <label className={labelClass}>
                Last Name
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                Email Address
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`}
                />
              </label>
              <label className={labelClass}>
                Phone Number
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  required
                  minLength={6}
                />
              </label>
              <label className={labelClass}>
                Address
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="mt-5 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto sm:px-6"
            >
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>

          <div className="border-t border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Security</h3>
            <p className="mt-1 text-xs text-slate-500">Keep your account secure with a strong password.</p>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <KeyIcon className="h-4 w-4 text-slate-500" />
              Change Password
            </button>
          </div>
        </section>

        {/* —— Right: Managed Vehicles —— */}
        <section className="rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Managed Vehicles</h2>
            <button
              type="button"
              onClick={openAddVehicle}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Vehicle
            </button>
          </div>

          <div className="p-5">
            {vehicles.length === 0 && !showVehicleForm ? (
              <EmptyState
                title="No vehicles yet"
                description="Add your first vehicle to book services and track maintenance."
                action={
                  <button
                    type="button"
                    onClick={openAddVehicle}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Add Vehicle
                  </button>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <li
                    key={v.id}
                    className="-mx-2 flex items-start justify-between gap-3 rounded-lg px-2 py-3.5 transition first:pt-0 last:pb-0 hover:bg-slate-50/80"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100">
                        <TruckIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {v.brand} {v.model}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-slate-600">{v.vehicleNumber}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {v.year} · {v.mileage.toLocaleString()} km
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEditVehicle(v)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                        aria-label="Edit vehicle"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteVehicle(v.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete vehicle"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Vehicle add/edit modal */}
      {showVehicleForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4">
          <div className="relative w-full max-w-lg">
            <button
              type="button"
              onClick={closeVehicleForm}
              className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 p-1.5 text-slate-500 shadow-sm hover:bg-white"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <AddVehicleForm
              customerId={customerId}
              vehicles={vehicles}
              editingVehicle={editingVehicle}
              variant="modal"
              onSuccess={handleVehicleFormSuccess}
              onCancel={closeVehicleForm}
            />
          </div>
        </div>
      ) : null}

      {/* Password modal */}
      {showPasswordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => void savePassword(e)} className="space-y-3 p-5">
              <label className={labelClass}>
                Current password
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={inputClass}
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className={labelClass}>
                New password
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={inputClass}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label className={labelClass}>
                Confirm new password
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={inputClass}
                  required
                  autoComplete="new-password"
                />
              </label>
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full rounded-lg bg-slate-800 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
