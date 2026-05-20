import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { fetchVendors, type Vendor } from '../../services/vendorApi'
import type { InventoryPart, PartPayload } from '../../services/partsApi'

export type PartFormMode = 'create' | 'edit'

type Props = {
  mode: PartFormMode
  open: boolean
  initial?: InventoryPart | null
  loading?: boolean
  onClose: () => void
  onSubmit: (payload: PartPayload) => void
}

type FormState = {
  partNumber: string
  name: string
  category: string
  vendorId: string
  price: string
  quantity: string
  description: string
  isActive: boolean
}

const emptyForm = (): FormState => ({
  partNumber: '',
  name: '',
  category: '',
  vendorId: '',
  price: '1',
  quantity: '1',
  description: '',
  isActive: true,
})

export function PartFormModal({ mode, open, initial, loading, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm())
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    void fetchVendors()
      .then(setVendors)
      .catch(() => setVendors([]))
  }, [open])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setForm({
        partNumber: initial.partNumber,
        name: initial.name,
        category: initial.category === 'General' ? '' : initial.category,
        vendorId: initial.vendorId ? String(initial.vendorId) : '',
        price: String(initial.price),
        quantity: String(initial.quantity),
        description: initial.description,
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
    if (!form.name.trim()) next.name = 'Part name is required'
    if (!form.price.trim() || Number(form.price) <= 0) next.price = 'Valid price required'
    if (form.quantity.trim() === '' || Number(form.quantity) < 0) next.quantity = 'Valid stock required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      partNumber: form.partNumber.trim() || undefined,
      name: form.name.trim(),
      category: form.category.trim() || 'General',
      description: form.description.trim(),
      sellingPrice: Number(form.price),
      price: Number(form.price),
      quantity: Math.max(0, Math.floor(Number(form.quantity))),
      criticalStockLevel: initial?.criticalStockLevel ?? 3,
      vendorId: form.vendorId ? Number(form.vendorId) : null,
      isActive: form.isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'create' ? 'Add New Part' : 'Edit Part'}
            </h2>
            <p className="text-sm text-slate-500">Inventory catalogue entry</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <Field label="Part Number" value={form.partNumber} onChange={(v) => setForm((f) => ({ ...f, partNumber: v }))} disabled={loading} optionalText="Auto-generated if empty" />
          <Field label="Name" value={form.name} error={errors.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} disabled={loading} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} disabled={loading} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Vendor</span>
              <select
                value={form.vendorId}
                onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              >
                <option value="">— None —</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" type="number" value={form.price} error={errors.price} onChange={(v) => setForm((f) => ({ ...f, price: v }))} disabled={loading} required />
            <Field label="Stock Level" type="number" value={form.quantity} error={errors.quantity} onChange={(v) => setForm((f) => ({ ...f, quantity: v }))} disabled={loading} required />
          </div>
          {mode === 'edit' ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select
                value={form.isActive ? 'Active' : 'Inactive'}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === 'Active' }))}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Saving…' : mode === 'create' ? 'Add Part' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
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
  optionalText,
}: {
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
  required?: boolean
  optionalText?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
        {optionalText ? <span className="font-normal text-slate-400"> ({optionalText})</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={[
          'w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:ring-2',
          error ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/15',
        ].join(' ')}
      />
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
