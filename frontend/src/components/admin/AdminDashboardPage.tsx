import { Shield, User, CalendarDays, Activity, Package, Users, Receipt, TrendingUp } from 'lucide-react'
import { ADMIN_ACCESS_GRID_KEYS, getFeatureById } from '../../admin/adminFeatureRegistry'
import type { AdminPageId } from '../../admin/adminPages'
import { getAccountEmailFromToken } from '../../lib/auth'

type Props = {
  onNavigate: (id: AdminPageId) => void
}

function accessTarget(featureId: number): AdminPageId | undefined {
  switch (featureId) {
    case 1:
      return 'customer-reports'
    case 2:
      return 'staff-management'
    case 3:
      return 'inventory'
    case 4:
      return 'sales-history'
    case 6:
      return 'customers'
    case 7:
      return 'sales-history'
    case 9:
      return 'customer-reports'
    case 10:
      return 'search-sale'
    case 13:
      return 'appointments'
    case 14:
      return 'customers'
    case 16:
      return 'customers'
    default:
      return undefined
  }
}

export function AdminDashboardPage({ onNavigate }: Props) {
  const account = getAccountEmailFromToken() ?? 'admin'
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const stats = [
    { label: 'Total Parts', value: '128', sub: 'Catalogue', Icon: Package },
    { label: 'Total Customers', value: '45', sub: 'Registered', Icon: Users },
    { label: 'Total Sales', value: '312', sub: 'All time', Icon: Receipt },
    { label: 'Revenue', value: 'Rs 2.4M', sub: 'Trailing quarter', Icon: TrendingUp },
  ]

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">
          System overview, statistics, and controlled access to modules.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quick overview</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-100">
            <Shield className="h-5 w-5 text-blue-600" />
            <div>
              <dt className="text-xs text-slate-500">Your role</dt>
              <dd className="font-semibold text-slate-900">Admin</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-100">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <dt className="text-xs text-slate-500">Account</dt>
              <dd className="truncate font-semibold text-slate-900" title={account}>
                {account}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-3 ring-1 ring-slate-100">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <div>
              <dt className="text-xs text-slate-500">Today&apos;s date</dt>
              <dd className="text-sm font-semibold text-slate-900">{today}</dd>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50/80 px-4 py-3 ring-1 ring-emerald-100">
            <Activity className="h-5 w-5 text-emerald-600" />
            <div>
              <dt className="text-xs text-slate-500">System status</dt>
              <dd className="font-semibold text-emerald-800">Active</dd>
            </div>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <s.Icon className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-semibold uppercase text-slate-400">{s.sub}</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm font-medium text-slate-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Feature access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_ACCESS_GRID_KEYS.map(({ label, featureId }) => {
            const f = getFeatureById(featureId)
            if (!f) return null
            const target = accessTarget(featureId)
            const Icon = f.Icon
            if (!target) return null
            return (
              <button
                key={label}
                type="button"
                onClick={() => onNavigate(target)}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    Active
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900">{label}</h3>
                <p className="mt-1 text-xs text-slate-600">{f.description}</p>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
