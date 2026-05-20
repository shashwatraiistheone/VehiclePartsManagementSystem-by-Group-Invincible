import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { APP_NAME } from '../../lib/appBranding'
import type { CreateVendorPayload, UpdateVendorPayload, Vendor } from '../../services/vendorApi'

export type VendorFormMode = 'create' | 'edit'

type Props = {
  mode: VendorFormMode
  open: boolean
  initial?: Vendor | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: CreateVendorPayload | UpdateVendorPayload) => void
}

type FormState = {
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  notes: string
  isActive: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  isActive: true,
})

export function VendorFormModal({ mode, open, initial, loading, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name,
        contactPerson: initial.contactPerson,
        phone: initial.phone,
        email: initial.email,
        address: initial.address ?? '',
        notes: initial.notes ?? '',
        isActive: initial.isActive,
      })
    } else {
      setForm(emptyForm())
    }
    setErrors({})
  }, [open, mode, initial])

  if (!open) return null

  function validate() {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Vendor name is required'
    if (!form.contactPerson.trim()) next.contactPerson = 'Contact person is required'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const base = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
    }

    if (mode === 'edit') {
      onSubmit({ ...base, isActive: form.isActive })
    } else {
      onSubmit(base)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'create' ? 'Add New Vendor' : 'Edit Vendor'}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === 'create'
                ? `Register a new parts supplier for ${APP_NAME}.`
                : 'Update supplier contact and status details.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <FormField
            label="Vendor Name"
            value={form.name}
            error={errors.name}
            onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            disabled={loading}
          />
          <FormField
            label="Contact Person"
            value={form.contactPerson}
            error={errors.contactPerson}
            onChange={(v) => setForm((f) => ({ ...f, contactPerson: v }))}
            disabled={loading}
          />
          <FormField
            label="Phone"
            type="tel"
            value={form.phone}
            error={errors.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            disabled={loading}
          />
          <FormField
            label="Email"
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            disabled={loading}
          />
          <FormField
            label="Address"
            value={form.address}
            optional
            onChange={(v) => setForm((f) => ({ ...f, address: v }))}
            disabled={loading}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              Notes <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              disabled={loading}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </label>
          {mode === 'edit' ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select
                value={form.isActive ? 'Active' : 'Inactive'}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'Active' }))}
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-violet-500 disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({
  label,
  value,
  error,
  onChange,
  disabled,
  type = 'text',
  optional = false,
}: {
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
  optional?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">
        {label}
        {optional ? <span className="font-normal text-slate-400"> (optional)</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          'w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15',
        ].join(' ')}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
