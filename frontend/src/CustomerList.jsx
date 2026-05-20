import { useEffect, useMemo, useState } from 'react'
import { Search, UserPlus, Eye, Pencil, Trash2, X } from 'lucide-react'
import CustomerHistory from './pages/CustomerHistory.jsx'
import {
  fetchCustomers,
  updateCustomerProfile,
  deleteCustomer,
  addVehicle,
} from './services/customerApi'

function formatLastVisit(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function primaryVehicle(vehicles) {
  if (!vehicles?.length) return '—'
  return vehicles[0].vehicleNumber || '—'
}

export default function CustomerList({ onNavigate }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editVehicle, setEditVehicle] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCustomers()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message ?? 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => {
    const all = customers.map((c) => ({
      id: c.id,
      name: c.name || '—',
      phone: c.phone || '—',
      vehicleNumber: primaryVehicle(c.vehicles),
      totalPurchases: c.totalPurchases ?? 0,
      lastVisit: formatLastVisit(c.lastVisitDate),
      status: c.status || (c.totalPurchases > 0 ? 'Active' : 'Inactive'),
      raw: c,
    }))
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q),
    )
  }, [customers, query])

  function startEdit(row) {
    setEditing(row)
    setEditName(row.name)
    setEditPhone(row.phone === '—' ? '' : row.phone)
    setEditVehicle(row.vehicleNumber === '—' ? '' : row.vehicleNumber)
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError(null)
    try {
      const vehicleNum = editVehicle.trim().toUpperCase()
      await updateCustomerProfile(editing.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editing.raw.address || '',
      })

      const existingVehicle = editing.raw.vehicles?.[0]
      if (vehicleNum && !existingVehicle) {
        await addVehicle(editing.id, {
          vehicleNumber: vehicleNum,
          brand: 'Unknown',
          model: 'Unknown',
          year: new Date().getFullYear(),
          mileage: 0,
        })
      }

      await load()
      setEditing(null)
    } catch (err) {
      setError(err?.message ?? 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    const ok = window.confirm(`Delete customer "${row.name}"?`)
    if (!ok) return
    setError(null)
    try {
      await deleteCustomer(row.id)
      setCustomers((prev) => prev.filter((c) => c.id !== row.id))
    } catch (err) {
      setError(err?.message ?? 'Failed to delete customer')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 bg-gray-100 p-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, vehicle..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('register-customer')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          + Add Customer
        </button>
      </header>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Customer Name</th>
                <th className="whitespace-nowrap px-4 py-3">Phone</th>
                <th className="whitespace-nowrap px-4 py-3">Vehicle Number</th>
                <th className="whitespace-nowrap px-4 py-3">Total Purchases</th>
                <th className="whitespace-nowrap px-4 py-3">Last Visit</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Loading customers…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.vehicleNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-800">{row.totalPurchases}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.lastVisit}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                          row.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                            : 'bg-rose-50 text-rose-700 ring-rose-200/80',
                        ].join(' ')}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerId(row.id)}
                        className="mr-1 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="mr-1 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomerId != null ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center" onClick={() => setSelectedCustomerId(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <CustomerHistory customerId={selectedCustomerId} onClose={() => setSelectedCustomerId(null)} />
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Edit Customer</h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form className="space-y-3" onSubmit={saveEdit}>
              <label className="block text-sm font-medium text-slate-700">
                Customer Name
                <input required value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Vehicle Number
                <input value={editVehicle} onChange={(e) => setEditVehicle(e.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15" />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
