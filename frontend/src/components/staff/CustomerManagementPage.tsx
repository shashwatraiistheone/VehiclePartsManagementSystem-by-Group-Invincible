import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Search, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { searchCustomers, type CustomerSearchResult } from '../../services/customerApi'
import { staffCreateSalePath, staffCustomerProfilePath, staffPath } from '../../staff/staffRoutes'
import { StaffCustomerEditModal } from './customers/StaffCustomerEditModal'
import { StaffCustomerHistoryDrawer } from './customers/StaffCustomerHistoryDrawer'
import { StaffCustomerRowActions } from './customers/StaffCustomerRowActions'

const PAGE_SIZES = [10, 25, 50] as const

function formatJoinDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-t border-slate-100">
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-4 animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

function VehicleCountBadge({ count }: { count: number }) {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/60"
      aria-label={`${count} registered vehicles`}
    >
      {count}
    </span>
  )
}

function CustomerMobileCard({
  customer,
  onHistory,
  onSale,
  onProfile,
  onEdit,
}: {
  customer: CustomerSearchResult
  onHistory: () => void
  onSale: () => void
  onProfile: () => void
  onEdit: () => void
}) {
  const vehicleCount = customer.vehicles?.length ?? 0
  return (
    <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{customer.name}</h3>
          <p className="mt-0.5 text-sm text-slate-600">{customer.phone}</p>
          <p className="text-sm text-slate-500">{customer.email}</p>
        </div>
        <VehicleCountBadge count={vehicleCount} />
      </div>
      <p className="mt-2 text-xs text-slate-500">Joined {formatJoinDate(customer.createdAt)}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StaffCustomerRowActions
          compact
          onHistory={onHistory}
          onSale={onSale}
          onProfile={onProfile}
        />
        <button
          type="button"
          onClick={onEdit}
          className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600 hover:shadow-md"
        >
          Edit Info
        </button>
      </div>
    </article>
  )
}

export function CustomerManagementPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(0)
  const [editCustomer, setEditCustomer] = useState<CustomerSearchResult | null>(null)
  const [historyCustomer, setHistoryCustomer] = useState<{ id: number; name: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await searchCustomers(query.trim())
      setCustomers(rows)
      setPage(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [load])

  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const pageRows = useMemo(() => {
    const start = safePage * pageSize
    return customers.slice(start, start + pageSize)
  }, [customers, safePage, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const rangeStart = customers.length === 0 ? 0 : safePage * pageSize + 1
  const rangeEnd = Math.min((safePage + 1) * pageSize, customers.length)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Customers</h1>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Manage Customers</h2>
            <p className="mt-1 text-sm text-slate-500">
              Register and search through your active customer base
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(staffPath('register-customer'))}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/30"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            Register New Customer
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(0)
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="whitespace-nowrap">entries</span>
          </label>

          <label className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Customers"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
        </div>

        {error ? (
          <div className="mx-5 mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-6">
            {error}
          </div>
        ) : null}

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 sm:px-6">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-center">Registered Vehicles</th>
                  <th className="px-4 py-3">Join Date</th>
                  <th className="px-5 py-3 sm:px-6">Actions</th>
                </tr>
              </thead>
              {loading ? (
                <TableSkeleton />
              ) : pageRows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm font-medium text-slate-500">
                      No customers found
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {pageRows.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900 sm:px-6">{c.name}</td>
                      <td className="px-4 py-4 text-slate-600">{c.phone}</td>
                      <td className="px-4 py-4 text-slate-600">{c.email}</td>
                      <td className="px-4 py-4 text-center">
                        <VehicleCountBadge count={c.vehicles?.length ?? 0} />
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatJoinDate(c.createdAt)}</td>
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <StaffCustomerRowActions
                            onHistory={() => setHistoryCustomer({ id: c.id, name: c.name })}
                            onSale={() => navigate(staffCreateSalePath(c.id))}
                            saleTo={staffCreateSalePath(c.id)}
                            onProfile={() => navigate(staffCustomerProfilePath(c.id))}
                          />
                          <button
                            type="button"
                            onClick={() => setEditCustomer(c)}
                            className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600 hover:shadow-md"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : pageRows.length === 0 ? (
            <p className="py-12 text-center text-sm font-medium text-slate-500">No customers found</p>
          ) : (
            pageRows.map((c) => (
              <CustomerMobileCard
                key={c.id}
                customer={c}
                onHistory={() => setHistoryCustomer({ id: c.id, name: c.name })}
                onSale={() => navigate(staffCreateSalePath(c.id))}
                onProfile={() => navigate(staffCustomerProfilePath(c.id))}
                onEdit={() => setEditCustomer(c)}
              />
            ))
          )}
        </div>

        {!loading && customers.length > 0 ? (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:px-6">
            <p>
              Showing {rangeStart}–{rangeEnd} of {customers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="px-2 text-xs text-slate-500">
                Page {safePage + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {editCustomer ? (
        <StaffCustomerEditModal
          customer={{
            id: editCustomer.id,
            name: editCustomer.name,
            phone: editCustomer.phone,
            address: editCustomer.address,
            email: editCustomer.email,
          }}
          onClose={() => setEditCustomer(null)}
          onSaved={() => void load()}
        />
      ) : null}

      {historyCustomer ? (
        <StaffCustomerHistoryDrawer
          customerId={historyCustomer.id}
          customerName={historyCustomer.name}
          onClose={() => setHistoryCustomer(null)}
        />
      ) : null}
    </div>
  )
}
