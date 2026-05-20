import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createVendor, type CreateVendorPayload } from '../services/vendorApi'

type Props = {
  onCancel: () => void
  onSuccess: () => void
}

type FormState = {
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
}

const initialForm: FormState = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
}

export default function CreateVendorPage({ onCancel, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Vendor name is required'
    if (!form.contactPerson.trim()) next.contactPerson = 'Contact person is required'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    const payload: CreateVendorPayload = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim() || undefined,
    }

    try {
      await createVendor(payload)
      onSuccess()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create vendor')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-1 py-6 sm:px-2 sm:py-10">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200"
      >
        <header className="rounded-t-xl bg-emerald-50 px-6 py-4 sm:px-8 sm:py-5">
          <h1 className="text-xl font-semibold tracking-tight text-emerald-900 sm:text-2xl">
            Add New Vendor
          </h1>
        </header>

        <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
          {submitError ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {submitError}
            </div>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-5">
              <Field
                label="Vendor Name"
                value={form.name}
                error={errors.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                disabled={submitting}
                required
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                error={errors.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                disabled={submitting}
                required
              />
              <label className="block text-sm sm:col-span-1">
                <span className="mb-1.5 block font-medium text-slate-700">Address</span>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  disabled={submitting}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-green-300 disabled:bg-slate-50"
                  placeholder="Street, city, state…"
                />
              </label>
            </div>

            <div className="space-y-5">
              <Field
                label="Contact Person"
                value={form.contactPerson}
                error={errors.contactPerson}
                onChange={(v) => setForm((f) => ({ ...f, contactPerson: v }))}
                disabled={submitting}
                required
              />
              <Field
                label="Email"
                type="email"
                value={form.email}
                error={errors.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                disabled={submitting}
                required
              />
            </div>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Vendor'
            )}
          </button>
        </footer>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  error,
  onChange,
  disabled,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
  required?: boolean
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200',
          'hover:border-slate-300 focus:ring-2 focus:ring-green-300 disabled:bg-slate-50',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-200 focus:border-emerald-400',
        ].join(' ')}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
