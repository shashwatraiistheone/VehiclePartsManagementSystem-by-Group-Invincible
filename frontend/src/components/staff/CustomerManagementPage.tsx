import { useMemo, useState } from 'react'
import { UserPlus, Edit3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { CustomerTable, type CustomerRow } from './CustomerTable'
import { CustomerForm } from './CustomerForm'
import type { Customer, CustomerInput } from './customerModule'
import { staffPath } from '../../staff/staffRoutes'
import { toDisplayDate } from './customerModule'

type Props = {
  customers: Customer[]
  onUpdateCustomer: (id: number, payload: CustomerInput) => void
  onDeleteCustomer: (id: number) => void
}

function toRow(customer: Customer): CustomerRow {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    vehicleNumber: customer.vehicleNumber,
    totalPurchases: customer.totalPurchases,
    lastVisit: toDisplayDate(customer.lastVisit),
    status: customer.status,
  }
}

export function CustomerManagementPage({ customers, onUpdateCustomer, onDeleteCustomer }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [viewId, setViewId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.name, c.phone, c.vehicleNumber, c.vehicleType].some((v) => v.toLowerCase().includes(q)),
    )
  }, [customers, query])

  const rows = useMemo(() => filtered.map(toRow), [filtered])
  const selected = customers.find((c) => c.id === viewId) ?? null
  const editing = customers.find((c) => c.id === editId) ?? null

  return (
    <div className="mx-auto max-w-6xl space-y-6 bg-gray-100 p-5">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Customers</h1>
          <p className="mt-1 text-sm text-slate-600">Display, edit, and maintain customer records.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(staffPath('register-customer'))}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          + Add Customer
        </button>
      </header>

      <SearchBar value={query} onChange={setQuery} placeholder="Search by name, phone, vehicle..." />

      <CustomerTable
        rows={rows}
        emptyMessage="No matching customers found."
        onView={setViewId}
        onEdit={setEditId}
        onDelete={(id) => {
          const ok = window.confirm('Delete this customer record?')
          if (ok) onDeleteCustomer(id)
        }}
      />

      {selected ? (
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Customer Details & History</h2>
            <button
              type="button"
              onClick={() => setViewId(null)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <p><span className="font-semibold text-slate-700">Name:</span> {selected.name}</p>
            <p><span className="font-semibold text-slate-700">Phone:</span> {selected.phone}</p>
            <p><span className="font-semibold text-slate-700">Vehicle:</span> {selected.vehicleNumber}</p>
            <p><span className="font-semibold text-slate-700">Type:</span> {selected.vehicleType}</p>
            <p><span className="font-semibold text-slate-700">Total purchases:</span> {selected.totalPurchases}</p>
            <p><span className="font-semibold text-slate-700">Last visit:</span> {toDisplayDate(selected.lastVisit)}</p>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="rounded-xl bg-white p-5 shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Edit Customer</h2>
          </div>
          <CustomerForm
            title="Update customer information"
            submitLabel="Save Changes"
            initialValue={editing}
            onSubmit={(value) => {
              onUpdateCustomer(editing.id, value)
              setEditId(null)
            }}
            onReset={() => setEditId(null)}
          />
        </div>
      ) : null}
    </div>
  )
}
