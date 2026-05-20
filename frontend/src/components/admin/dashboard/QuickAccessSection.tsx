import {
  Gauge,
  PackageSearch,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Boxes,
  Users,
  LineChart,
  ArrowUpRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AdminPageId } from '../../../admin/adminPages'

type QuickAccessItem = {
  title: string
  description: string
  page: AdminPageId
  Icon: LucideIcon
  iconGradient: string
  ring: string
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    title: 'Staff Dashboard',
    description: 'Monitor daily staff operations',
    page: 'staff-dashboard',
    Icon: Gauge,
    iconGradient: 'from-blue-500 via-blue-600 to-indigo-600',
    ring: 'group-hover:ring-blue-200/80',
  },
  {
    title: 'Parts Catalog',
    description: 'Browse and search vehicle parts',
    page: 'search-sale',
    Icon: PackageSearch,
    iconGradient: 'from-sky-500 via-cyan-500 to-teal-600',
    ring: 'group-hover:ring-cyan-200/80',
  },
  {
    title: 'Appointments',
    description: 'Schedule and manage bookings',
    page: 'appointments',
    Icon: CalendarDays,
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    ring: 'group-hover:ring-violet-200/80',
  },
  {
    title: 'Sales History',
    description: 'Review transactions and receipts',
    page: 'sales-history',
    Icon: CreditCard,
    iconGradient: 'from-indigo-500 via-blue-600 to-blue-700',
    ring: 'group-hover:ring-indigo-200/80',
  },
  {
    title: 'Admin Panel',
    description: 'System controls and overview',
    page: 'admin-dashboard',
    Icon: LayoutDashboard,
    iconGradient: 'from-blue-600 via-blue-700 to-slate-800',
    ring: 'group-hover:ring-blue-300/80',
  },
  {
    title: 'Parts Inventory',
    description: 'Manage stock and availability',
    page: 'inventory',
    Icon: Boxes,
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    ring: 'group-hover:ring-emerald-200/80',
  },
  {
    title: 'Manage Customers',
    description: 'Customer records and accounts',
    page: 'customers',
    Icon: Users,
    iconGradient: 'from-blue-500 via-sky-500 to-cyan-600',
    ring: 'group-hover:ring-sky-200/80',
  },
  {
    title: 'Reports',
    description: 'Analytics and business insights',
    page: 'customer-reports',
    Icon: LineChart,
    iconGradient: 'from-slate-600 via-slate-700 to-slate-900',
    ring: 'group-hover:ring-slate-300/80',
  },
]

type Props = {
  onNavigate: (id: AdminPageId) => void
}

export function QuickAccessSection({ onNavigate }: Props) {
  return (
    <section
      aria-label="Quick Access"
      className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Quick Access</h2>
          <p className="mt-1 text-sm text-slate-500">Jump to modules and workflows across the ERP</p>
        </div>
        <span className="shrink-0 rounded-full border border-blue-200/80 bg-blue-50 px-3 py-1 text-[10px] font-bold tracking-widest text-blue-700 shadow-sm">
          SHORTCUTS
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACCESS_ITEMS.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onNavigate(item.page)}
            className={[
              'group relative flex w-full cursor-pointer flex-col rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm',
              'ring-1 ring-transparent transition-all duration-300 ease-out',
              'hover:-translate-y-1 hover:border-blue-200/70 hover:shadow-xl hover:shadow-blue-500/10',
              item.ring,
            ].join(' ')}
          >
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/0 via-white to-blue-50/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />

            <ArrowUpRight
              className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600"
              aria-hidden
            />

            <span
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.iconGradient} text-white shadow-md shadow-slate-900/10 transition-transform duration-300 group-hover:scale-105`}
            >
              <item.Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>

            <div className="relative mt-3.5 min-w-0 pr-4">
              <p className="text-sm font-bold leading-snug text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
