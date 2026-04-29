import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { addPart, getParts, getToken, type Part } from '../../api'

function parseBrandCategory(description: string | undefined): { brand: string; category: string } {
  const d = description?.trim() ?? ''
  if (!d.includes('|')) {
    return { brand: '—', category: 'General' }
  }
  const i = d.indexOf('|')
  return {
    brand: d.slice(0, i).trim() || '—',
    category: d.slice(i + 1).trim() || 'General',
  }
}

function stockTone(q: number): string {
  if (q <= 0) return 'bg-rose-100 text-rose-800 ring-rose-200/80'
  if (q < 10) return 'bg-amber-100 text-amber-900 ring-amber-200/80'
  return 'bg-emerald-100 text-emerald-900 ring-emerald-200/80'
}

export function AdminInventoryPage() {
  const token = useMemo(() => getToken(), [])
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('1')
  const [stock, setStock] = useState('1')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getParts(token)
      setParts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load parts')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError(null)
    const desc = [brand.trim(), category.trim()].filter(Boolean).join('|') || ''
    try {
      await addPart(token, {
        name: name.trim(),
        description: desc,
        price: Number(price),
        quantity: Math.max(0, Math.floor(Number(stock))),
      })
      setName('')
      setBrand('')
      setCategory('')
      setPrice('1')
      setStock('1')
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add part')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory management</h1>
          <p className="mt-1 text-slate-600">Parts catalogue, pricing, and live stock levels.</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add new part
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Part name</th>
                <th className="whitespace-nowrap px-4 py-3">Brand</th>
                <th className="whitespace-nowrap px-4 py-3">Category</th>
                <th className="whitespace-nowrap px-4 py-3">Price</th>
                <th className="whitespace-nowrap px-4 py-3">Stock</th>
                <th className="whitespace-nowrap px-4 py-3">Added date</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    <p className="mt-2 text-sm">Loading inventory…</p>
                  </td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No parts yet. Add your first item with &quot;Add new part&quot;.
                  </td>
                </tr>
              ) : (
                parts.map((p) => {
                  const { brand, category } = parseBrandCategory(p.description)
                  const added = p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString('en-GB')
                    : '—'
                  return (
                    <tr key={p.id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{brand}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{category}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-800">
                        Rs {Number(p.price).toLocaleString('en-LK', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-lg px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                            stockTone(p.quantity),
                          ].join(' ')}
                        >
                          {p.quantity}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{added}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          type="button"
                          title="Edit (wire to API)"
                          onClick={() => window.alert('Edit part: connect to your update endpoint when available.')}
                          className="mr-1 inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete (wire to API)"
                          onClick={() => window.alert('Delete part: connect to your delete endpoint when available.')}
                          className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-part-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 id="add-part-title" className="text-lg font-bold text-slate-900">
              Add new part
            </h2>
            <p className="mt-1 text-sm text-slate-500">Brand and category are stored with the part record.</p>
            <form className="mt-5 space-y-4" onSubmit={handleAdd}>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">Part name</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500/0 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                  placeholder="e.g. Oil filter"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Brand</span>
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                    placeholder="OEM"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Category</span>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                    placeholder="Filters"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Price (Rs)</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Stock</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save part
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
