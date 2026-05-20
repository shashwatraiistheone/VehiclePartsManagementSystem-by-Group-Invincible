import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { RegisterStaffPayload, StaffMember, UpdateStaffPayload } from '../../services/staffApi'

export type StaffFormMode = 'create' | 'edit'

const inputClass =
  'w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const textareaClass =
  'w-full min-h-[120px] resize-y rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

type Props = {
  mode: StaffFormMode
  open: boolean
  initial?: StaffMember | null
  loading?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (payload: RegisterStaffPayload | UpdateStaffPayload) => void
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function joinName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}

function generateTempPassword(): string {
  const part = Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(0, 8)
  return `Staff@${part}1`
}

function FormField({
  label,
  htmlFor,
  children,
  className = '',
}: {
  label: string
  htmlFor: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  )
}

export function StaffFormModal({
  mode,
  open,
  initial,
  loading,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      const { firstName: first, lastName: last } = splitName(initial.fullName)
      setFirstName(first)
      setLastName(last)
      setEmail(initial.email)
      setPhone(initial.phone)
      setAddress('')
    } else {
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setAddress('')
    }
  }, [open, mode, initial])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, loading, onClose])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullName = joinName(firstName, lastName)
    if (!fullName) return

    if (mode === 'create') {
      onSubmit({
        fullName,
        email: email.trim(),
        phone: phone.trim(),
        password: generateTempPassword(),
        role: 'Staff',
      })
      return
    }

    onSubmit({
      fullName,
      phone: phone.trim(),
      role: initial?.role === 'Admin' ? 'Admin' : 'Staff',
    })
  }

  const title = mode === 'create' ? 'Add Staff' : 'Edit Staff'
  const submitLabel = mode === 'create' ? 'Add Staff' : 'Save changes'

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px] sm:p-6"
      role="presentation"
      onClick={loading ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-form-title"
        className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-6 py-5">
          <h2 id="staff-form-title" className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-[10px] p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {error ? (
            <div
              role="alert"
              className="rounded-[10px] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800"
            >
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="First Name" htmlFor="staff-first-name">
              <input
                id="staff-first-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                placeholder="Jane"
                disabled={loading}
                className={inputClass}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="staff-last-name">
              <input
                id="staff-last-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                placeholder="Smith"
                disabled={loading}
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="Email" htmlFor="staff-email">
            <input
              id="staff-email"
              required
              type="email"
              disabled={mode === 'edit' || loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="staff@example.com"
              className={inputClass}
            />
          </FormField>

          <FormField label="Phone" htmlFor="staff-phone">
            <input
              id="staff-phone"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="+1 555 000 0000"
              disabled={loading}
              className={inputClass}
            />
          </FormField>

          <FormField label="Address" htmlFor="staff-address">
            <textarea
              id="staff-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, state, ZIP"
              disabled={loading}
              rows={4}
              className={textareaClass}
            />
          </FormField>

          <div className="flex flex-col-reverse gap-2 border-t border-[#E5E7EB] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-[10px] bg-[#F3F4F6] px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-[#E5E7EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-[10px] bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
