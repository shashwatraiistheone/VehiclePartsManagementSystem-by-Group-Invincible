import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { createPart, type CreatePartPayload } from '../services/partsApi'
import { fetchVendors, type Vendor } from '../services/vendorApi'

const PART_CATEGORIES = [
  'Engine',
  'Cooling',
  'Electrical',
  'Interior',
  'Transmission',
  'Brakes',
  'Suspension',
] as const

type Props = {
  onCancel: () => void
  onSuccess: () => void
}

type FormState = {
  partNumber: string
  name: string
  category: string
  vendorId: string
  description: string
  costPrice: string
  sellingPrice: string
  initialStock: string
  criticalStockLevel: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialForm: FormState = {
  partNumber: '',
  name: '',
  category: '',
  vendorId: '',
  description: '',
  costPrice: '0',
  sellingPrice: '',
  initialStock: '0',
  criticalStockLevel: '3',
}

export default function CreatePartPage({ onCancel, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const categoryOptions = useMemo(
    () => PART_CATEGORIES.map((c) => ({ value: c, label: c })),
    [],
  )

  const vendorOptions = useMemo(
    () => vendors.map((v) => ({ value: String(v.id), label: v.name })),
    [vendors],
  )

  useEffect(() => {
    void fetchVendors()
      .then(setVendors)
      .catch(() => setVendors([]))
  }, [])

  function validate(): boolean {
    const next: FormErrors = {}
    if (!form.partNumber.trim()) next.partNumber = 'Part number is required'
    if (!form.name.trim()) next.name = 'Part name is required'
    if (!form.category) next.category = 'Category is required'
    if (!form.vendorId) next.vendorId = 'Vendor is required'

    const selling = Number(form.sellingPrice)
    if (!form.sellingPrice.trim() || Number.isNaN(selling) || selling <= 0) {
      next.sellingPrice = 'Selling price must be greater than 0'
    }

    const cost = Number(form.costPrice)
    if (form.costPrice.trim() !== '' && (Number.isNaN(cost) || cost < 0)) {
      next.costPrice = 'Cost price cannot be negative'
    }

    const stock = Number(form.initialStock)
    if (form.initialStock.trim() === '' || Number.isNaN(stock) || stock < 0) {
      next.initialStock = 'Initial stock cannot be negative'
    }

    const critical = Number(form.criticalStockLevel)
    if (form.criticalStockLevel.trim() === '' || Number.isNaN(critical) || critical < 0) {
      next.criticalStockLevel = 'Critical level cannot be negative'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setSubmitError(null)

    const payload: CreatePartPayload = {
      partNumber: form.partNumber.trim(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice),
      quantity: Number(form.initialStock) || 0,
      criticalStockLevel: Number(form.criticalStockLevel) || 3,
      vendorId: Number(form.vendorId),
      isActive: true,
    }

    try {
      await createPart(payload)
      onSuccess()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create part')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-slate-100/80 px-2 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200"
        >
          <header className="rounded-t-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-5 sm:px-8">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">Add New Part</h1>
          </header>

          <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
            {submitError ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {submitError}
              </div>
            ) : null}

            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-800">
                Basic Info
              </h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-5">
                  <Field
                    label="Part Number"
                    value={form.partNumber}
                    error={errors.partNumber}
                    onChange={(v) => setForm((f) => ({ ...f, partNumber: v }))}
                    disabled={submitting}
                    required
                    placeholder="e.g. FLK-00089"
                  />
                  <SearchableSelect
                    label="Category"
                    value={form.category}
                    options={categoryOptions}
                    placeholder="Select category"
                    error={errors.category}
                    disabled={submitting}
                    required
                    onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  />
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-700">Description</span>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      disabled={submitting}
                      rows={5}
                      className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50"
                      placeholder="Part details, fitment notes, specifications…"
                    />
                  </label>
                </div>

                <div className="space-y-5">
                  <Field
                    label="Part Name"
                    value={form.name}
                    error={errors.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    disabled={submitting}
                    required
                    placeholder="e.g. Fuel Tank"
                  />
                  <SearchableSelect
                    label="Vendor"
                    value={form.vendorId}
                    options={vendorOptions}
                    placeholder="Select Vendor"
                    error={errors.vendorId}
                    disabled={submitting}
                    required
                    onChange={(v) => setForm((f) => ({ ...f, vendorId: v }))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-800">
                Pricing &amp; Stock
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Cost Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  error={errors.costPrice}
                  onChange={(v) => setForm((f) => ({ ...f, costPrice: v }))}
                  disabled={submitting}
                  prefix="Rs"
                />
                <Field
                  label="Selling Price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.sellingPrice}
                  error={errors.sellingPrice}
                  onChange={(v) => setForm((f) => ({ ...f, sellingPrice: v }))}
                  disabled={submitting}
                  required
                  prefix="Rs"
                />
                <Field
                  label="Initial Stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.initialStock}
                  error={errors.initialStock}
                  onChange={(v) => setForm((f) => ({ ...f, initialStock: v }))}
                  disabled={submitting}
                />
                <Field
                  label="Critical Stock Level"
                  type="number"
                  min="0"
                  step="1"
                  value={form.criticalStockLevel}
                  error={errors.criticalStockLevel}
                  onChange={(v) => setForm((f) => ({ ...f, criticalStockLevel: v }))}
                  disabled={submitting}
                />
              </div>
            </section>
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create Part'
              )}
            </button>
          </footer>
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
  placeholder,
  min,
  step,
  prefix,
}: {
  label: string
  value: string
  error?: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: string
  required?: boolean
  placeholder?: string
  min?: string
  step?: string
  prefix?: string
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {prefix ? (
        <div
          className={[
            'flex overflow-hidden rounded-lg border transition-all duration-200',
            'hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-300',
            error
              ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-200'
              : 'border-slate-200 focus-within:border-blue-500',
          ].join(' ')}
        >
          <span className="flex shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-500">
            {prefix}
          </span>
          <input
            type={type}
            min={min}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-0 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
      ) : (
        <input
          type={type}
          min={min}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition-all duration-200',
            'hover:border-slate-300 focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-slate-200 focus:border-blue-500',
          ].join(' ')}
        />
      )}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  )
}
