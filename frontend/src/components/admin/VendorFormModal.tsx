import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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

const emptyForm = (): CreateVendorPayload => ({
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
})

export function VendorFormModal({ mode, open, initial, loading, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<CreateVendorPayload>(emptyForm())
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
    onSubmit({
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address?.trim() || undefined,
    })
  }

  function field(
    key: keyof CreateVendorPayload,
    label: string,
    required = true,
    type: string = 'text',
  ) {
    const err = errors[key]
    return (
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">
          {label}
          {!required ? <span className="font-normal text-slate-400"> (optional)</span> : null}
        </span>
        <input
          type={type}
          value={form[key] ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          disabled={loading}
          className={[
            'w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2',
            err
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15',
          ].join(' ')}
        />
        {err ? <span className="mt-1 block text-xs text-red-600">{err}</span> : null}
      </label>
    )
  }

  return (
    <ModalOverlay>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <ModalHeader mode={mode} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {field('name', 'Vendor name')}
          {field('contactPerson', 'Contact person')}
          {field('phone', 'Phone', true, 'tel')}
          {field('email', 'Email', true, 'email')}
          {field('address', 'Address', false)}

          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Saving…' : mode === 'create' ? 'Add vendor' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  )
}

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      {children}
    </div>
  )
}

function ModalHeader({ mode }: { mode: VendorFormMode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900">
        {mode === 'create' ? 'Add vendor' : 'Edit vendor'}
      </h2>
      <p className="text-sm text-slate-500">
        {mode === 'create' ? 'Register a new parts supplier.' : 'Update supplier details.'}
      </p>
    </div>
  )
}
