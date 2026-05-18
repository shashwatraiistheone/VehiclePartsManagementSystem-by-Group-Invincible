import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { RegisterStaffPayload, StaffMember, UpdateStaffPayload } from '../../services/staffApi'

export type StaffFormMode = 'create' | 'edit'

type Props = {
  mode: StaffFormMode
  open: boolean
  initial?: StaffMember | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: RegisterStaffPayload | UpdateStaffPayload) => void
}

export function StaffFormModal({ mode, open, initial, loading, onClose, onSubmit }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'Admin' | 'Staff'>('Staff')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setFullName(initial.fullName)
      setEmail(initial.email)
      setPhone(initial.phone)
      setRole(initial.role === 'Admin' ? 'Admin' : 'Staff')
      setPassword('')
    } else {
      setFullName('')
      setEmail('')
      setPhone('')
      setPassword('')
      setRole('Staff')
    }
  }, [open, mode, initial])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'create') {
      onSubmit({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      })
      return
    }

    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
    })
  }

  return (
    <ModalBackdrop>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'create' ? 'Register staff' : 'Edit staff'}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === 'create'
                ? 'Create a new staff or admin account.'
                : 'Update name, phone, or role.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              required
              type="email"
              disabled={mode === 'edit'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Phone</span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            />
          </label>

          {mode === 'create' ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Password</span>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
              />
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'Admin' | 'Staff')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
            >
              <option value="Staff">Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Saving…' : mode === 'create' ? 'Add staff' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  )
}

function ModalBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      {children}
    </div>
  )
}
