import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error CustomerHistory is JSX
import CustomerHistory from '../../pages/CustomerHistory.jsx'
import { SearchBar } from './SearchBar'
import { CustomerTable, type CustomerRow } from './CustomerTable'
import { mapCustomerToRow, type ApiCustomer } from './customerRows'

function safeJson(text: string) {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function CustomerManagementPage() {
  const [customers, setCustomers] = useState<ApiCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL as string
      const res = await fetch(`${apiBase}/api/Customer`)
      const text = await res.text()
      const data = safeJson(text) as ApiCustomer[] | Record<string, unknown> | null
      if (!res.ok) {
        const msg =
          (data && typeof data === 'object' && 'message' in data && String((data as { message: unknown }).message)) ||
          'Failed to load customers'
        throw new Error(msg)
      }
      setCustomers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredApi = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q),
    )
  }, [customers, query])

  const rows: CustomerRow[] = useMemo(() => filteredApi.map(mapCustomerToRow), [filteredApi])

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL as string
      const res = await fetch(`${apiBase}/api/Customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, address: '' }),
      })
      const text = await res.text()
      const data = safeJson(text) as { message?: string } | null
      if (!res.ok) {
        throw new Error((data && data.message) || 'Failed to add customer')
      }
      setName('')
      setEmail('')
      setPhone('')
      setShowAdd(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Customer Management</h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">View and manage customer records</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          + Add Customer
        </button>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      <SearchBar value={query} onChange={setQuery} />

      <CustomerTable
        rows={rows}
        loading={loading}
        emptyMessage={query ? 'No customers match your search.' : 'No customers yet. Add your first customer.'}
        onView={(id) => setSelectedId(id)}
        onEdit={(id) =>
          window.alert(`Edit customer #${id}: connect to your update customer API when ready.`)
        }
      />

      {selectedId != null ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
          role="presentation"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomerHistory customerId={selectedId} onClose={() => setSelectedId(null)} />
          </div>
        </div>
      ) : null}

      {showAdd ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setShowAdd(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Add customer</h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={addCustomer}>
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Full name"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="email@example.com"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="+94 …"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
