import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ClipboardList,
  DollarSign,
  RefreshCw,
  Receipt,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { StaffViewId } from '../../staff/staffViewId'
import { staffPath } from '../../staff/staffRoutes'
import { getStoredUserName } from '../../lib/auth'
import { searchCustomers, type CustomerSearchResult } from '../../services/customerApi'
import { fetchStaffWorkspace, type StaffWorkspaceData } from '../../services/staffDashboardApi'
import { formatMoney } from '../../utils/formatUsd'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function mapAppointmentBadge(status: string): { label: string; className: string } {
  const s = status.toLowerCase()
  if (s === 'approved' || s === 'confirmed') {
    return { label: 'CONFIRMED', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80' }
  }
  if (s === 'completed') {
    return { label: 'COMPLETED', className: 'bg-slate-100 text-slate-600 ring-slate-200/80' }
  }
  return { label: 'PENDING', className: 'bg-amber-50 text-amber-800 ring-amber-200/80' }
}

function PaymentBadge({ status }: { status: string }) {
  const s = status.toUpperCase()
  const styles =
    s === 'PAID'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
      : s === 'PARTIAL'
        ? 'bg-amber-50 text-amber-800 ring-amber-200/80'
        : 'bg-orange-50 text-orange-800 ring-orange-200/80'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${styles}`}>
      {s}
    </span>
  )
}

function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${className}`}>
      {label}
    </span>
  )
}

function StatCard({ label, value, loading }: { label: string; value: number | string; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" /> : value}
      </p>
    </div>
  )
}

function DashboardPanel({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string
  actionLabel: string
  onAction: () => void
  children: ReactNode
}) {
  return (
    <section className="flex min-h-[280px] flex-col rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          {actionLabel}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-x-auto p-0">{children}</div>
    </section>
  )
}

function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-5 py-10 text-center text-sm text-slate-500">{message}</p>
}

function AnalyticsSummaryCard(props: {
  label: string
  value: string | number
  Icon: LucideIcon
  iconBg: string
  iconColor: string
  loading?: boolean
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200/90 bg-white px-5 py-6 text-center shadow-sm transition hover:shadow-md">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${props.iconBg} ${props.iconColor}`}
      >
        <props.Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{props.label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
        {props.loading ? (
          <span className="inline-block h-7 w-16 animate-pulse rounded bg-slate-100" />
        ) : (
          props.value
        )}
      </p>
    </div>
  )
}

type QuickAction = {
  label: string
  Icon: LucideIcon
  view: StaffViewId
  variant: 'blue' | 'green' | 'white'
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Create New Sale', Icon: ShoppingCart, view: 'search-sale', variant: 'blue' },
  { label: 'New Customer', Icon: UserPlus, view: 'register-customer', variant: 'green' },
  { label: 'Customers', Icon: Users, view: 'manage-customers', variant: 'white' },
  { label: 'Part Requests', Icon: ClipboardList, view: 'part-requests', variant: 'white' },
  { label: 'Appointments', Icon: CalendarDays, view: 'appointments', variant: 'white' },
  { label: 'Sales History', Icon: Receipt, view: 'sales-history', variant: 'white' },
]

function QuickActionCard({
  label,
  Icon,
  variant,
  onClick,
}: {
  label: string
  Icon: LucideIcon
  variant: QuickAction['variant']
  onClick: () => void
}) {
  const isGradient = variant === 'blue' || variant === 'green'
  const cardClass =
    variant === 'blue'
      ? 'border-transparent bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
      : variant === 'green'
        ? 'border-transparent bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-600/25 hover:from-emerald-600 hover:to-green-700 hover:shadow-lg'
        : 'border-slate-200/90 bg-white text-slate-800 shadow-sm hover:border-blue-200 hover:shadow-md'

  const iconWrapClass =
    variant === 'blue'
      ? 'bg-white/20 text-white'
      : variant === 'green'
        ? 'bg-white/20 text-white'
        : 'bg-slate-50 text-slate-600 ring-1 ring-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center justify-center rounded-xl border px-4 py-6 transition duration-200 hover:-translate-y-0.5 ${cardClass}`}
    >
      <span
        className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full transition group-hover:scale-105 ${iconWrapClass}`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
      </span>
      <span className={`text-center text-sm font-semibold ${isGradient ? 'text-white' : 'text-slate-800'}`}>
        {label}
      </span>
    </button>
  )
}

function overdueBadgeClass(days: number): string {
  if (days >= 90) return 'bg-rose-100 text-rose-800 ring-rose-200/90'
  if (days >= 30) return 'bg-red-50 text-red-700 ring-red-200/80'
  return 'bg-pink-50 text-pink-700 ring-pink-200/80'
}

export function StaffDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<StaffWorkspaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchStaffWorkspace())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const accountLabel =
    data?.account?.trim() ||
    getStoredUserName()?.trim().toLowerCase().replace(/\s+/g, '.') ||
    'staff'

  async function runSearch() {
    const term = searchInput.trim()
    if (!term) {
      setSearchResults([])
      setSearchError(null)
      return
    }
    setSearching(true)
    setSearchError(null)
    try {
      const results = await searchCustomers(term)
      setSearchResults(results)
      if (results.length === 0) setSearchError('No customers match your search.')
    } catch (err) {
      setSearchResults([])
      setSearchError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  function resetSearch() {
    setSearchInput('')
    setSearchResults([])
    setSearchError(null)
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Unable to load dashboard</p>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
            Staff Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, <span className="font-semibold text-slate-800">{accountLabel}</span>!
            Here&apos;s your daily summary.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My Sales Today" value={data?.salesTodayCount ?? 0} loading={loading && !data} />
        <StatCard label="This Week" value={data?.salesWeekCount ?? 0} loading={loading && !data} />
        <StatCard
          label="Customers Serviced"
          value={data?.customersServicedWeek ?? 0}
          loading={loading && !data}
        />
        <StatCard
          label="Pending Appointments"
          value={data?.pendingAppointmentsCount ?? 0}
          loading={loading && !data}
        />
      </div>

      <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Quick Customer Search</h2>
            <p className="mt-0.5 text-xs text-slate-500">Find customers by contact or name</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl lg:justify-end">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runSearch()
              }}
              placeholder="Search by name, phone, or email"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
            <button
              type="button"
              onClick={resetSearch}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Reset
            </button>
          </div>
        </div>
        {searchError ? <p className="mt-3 text-sm text-amber-700">{searchError}</p> : null}
        {searchResults.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {searchResults.slice(0, 6).map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{c.phone}</td>
                    <td className="px-4 py-2.5 text-slate-600">{c.email || '—'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(staffPath('search-sale'), { state: { customerId: c.id } })
                        }
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        New sale
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardPanel
          title="Today's Confirmed Appointments"
          actionLabel="Manage All"
          onAction={() => navigate(staffPath('appointments'))}
        >
          {loading && !data ? (
            <table className="min-w-full text-sm">
              <TableSkeleton rows={4} cols={5} />
            </table>
          ) : data && data.todayConfirmedAppointments.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {data.todayConfirmedAppointments.map((a) => {
                const badge = mapAppointmentBadge(a.status)
                return (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-slate-50/80"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{a.customerName}</p>
                      <p className="text-xs text-slate-500">
                        {a.vehicleNumber || 'No vehicle'} · {a.serviceType}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <span className="text-xs font-medium text-slate-600">{formatTime(a.date)}</span>
                      <StatusPill label={badge.label} className={badge.className} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState message="No appointments scheduled for today." />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Pending Part Requests"
          actionLabel="View All"
          onAction={() => navigate(staffPath('part-requests'))}
        >
          {loading && !data ? (
            <table className="min-w-full text-sm">
              <TableSkeleton rows={4} cols={4} />
            </table>
          ) : data && data.pendingPartRequests.length > 0 ? (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Part</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.pendingPartRequests.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.customerName}</td>
                    <td className="px-4 py-3 text-slate-700">{r.partName}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label="PENDING"
                        className="bg-amber-50 text-amber-800 ring-amber-200/80"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No pending part requests." />
          )}
        </DashboardPanel>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-bold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map(({ label, Icon, view, variant }) => (
            <QuickActionCard
              key={label}
              label={label}
              Icon={Icon}
              variant={variant}
              onClick={() => navigate(staffPath(view))}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <AnalyticsSummaryCard
          label="Sales This Week"
          value={data?.salesWeekCount ?? 0}
          Icon={ShoppingCart}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading && !data}
        />
        <AnalyticsSummaryCard
          label="Revenue This Month"
          value={formatMoney(data?.revenueThisMonth ?? 0)}
          Icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading && !data}
        />
        <AnalyticsSummaryCard
          label="Customers Served This Month"
          value={data?.customersServicedMonth ?? 0}
          Icon={Sparkles}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          loading={loading && !data}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPanel
          title="Overdue Payments"
          actionLabel="View All"
          onAction={() => navigate(staffPath('credit-management'))}
        >
          {loading && !data ? (
            <table className="min-w-full text-sm">
              <TableSkeleton rows={3} cols={4} />
            </table>
          ) : data && data.overduePayments.length > 0 ? (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Invoice</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.overduePayments.map((inv) => (
                  <tr key={inv.invoiceId} className="transition hover:bg-rose-50/30">
                    <td className="px-4 py-3 font-medium text-slate-900">{inv.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(inv.balanceAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        label={`${inv.overdueDays} DAYS`}
                        className={overdueBadgeClass(inv.overdueDays)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No overdue payments." />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="My Recent Sales"
          actionLabel="View All"
          onAction={() => navigate(staffPath('sales-history'))}
        >
          {loading && !data ? (
            <table className="min-w-full text-sm">
              <TableSkeleton rows={4} cols={4} />
            </table>
          ) : data && data.recentSales.length > 0 ? (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Invoice</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentSales.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-900">{s.customerName}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatMoney(s.finalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={s.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState message="No recent sales." />
          )}
        </DashboardPanel>
      </div>
    </div>
  )
}
