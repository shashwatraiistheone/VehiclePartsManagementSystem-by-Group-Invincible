import {
  Home,
  LayoutDashboard,
  Shield,
  UserSquare2,
  Users,
  ScanSearch,
  UserPlus,
  Receipt,
  Wallet,
  PieChart,
  FilePlus2,
  CalendarDays,
  ClipboardList,
  Package,
  Truck,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import type { AdminPageId } from '../../admin/adminPages'
import { getAccountEmailFromToken } from '../../lib/auth'

type NavItem = {
  id: AdminPageId
  label: string
  Icon: typeof Home
  disabled?: boolean
}

type Section = { title: string; items: NavItem[] }

const sections: Section[] = [
  {
    title: 'Main',
    items: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'staff-dashboard', label: 'Staff Dashboard', Icon: LayoutDashboard },
      { id: 'admin-dashboard', label: 'Admin Dashboard', Icon: Shield },
      { id: 'staff-management', label: 'Manage Staff', Icon: UserSquare2 },
    ],
  },
  {
    title: 'Customer management',
    items: [
      { id: 'customers', label: 'Manage Customers', Icon: Users },
      { id: 'search-sale', label: 'Search & Sale', Icon: ScanSearch },
      { id: 'register-customer', label: 'Register Customer', Icon: UserPlus },
    ],
  },
  {
    title: 'Sales & finance',
    items: [
      { id: 'sales-history', label: 'Sales History', Icon: Receipt },
      { id: 'credit-management', label: 'Credit Management', Icon: Wallet },
      { id: 'customer-reports', label: 'Customer Reports', Icon: PieChart },
      { id: 'generate-invoice', label: 'Generate Invoice', Icon: FilePlus2 },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'appointments', label: 'Appointments', Icon: CalendarDays },
      { id: 'part-requests', label: 'Part Requests', Icon: ClipboardList, disabled: true },
      { id: 'inventory', label: 'Inventory Management', Icon: Package },
      { id: 'vendors', label: 'Manage Vendors', Icon: Truck },
    ],
  },
]

type Props = {
  active: AdminPageId
  onSelect: (id: AdminPageId) => void
  onLogout: () => void
}

export function AdminPanelSidebar({ active, onSelect, onLogout }: Props) {
  const email = getAccountEmailFromToken() ?? 'admin'

  return (
    <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-slate-800/80 bg-slate-950 text-slate-200 shadow-xl sm:max-h-none md:h-screen md:max-h-screen md:w-72 md:border-b-0 md:border-r md:border-slate-800/80">
      <div className="border-b border-slate-800/80 px-5 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl font-bold tracking-tight text-white">PartsHub</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">Vehicle Parts Management</p>
          </div>
          <span className="shrink-0 rounded-lg bg-blue-600/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-blue-600/30">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Admin">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ id, label, Icon, disabled }) => {
                const on = active === id && !disabled
                return (
                  <li key={id}>
                    <button
                      type="button"
                      disabled={disabled}
                      title={disabled ? `${label} (Unavailable)` : label}
                      onClick={() => !disabled && onSelect(id)}
                      className={[
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
                        disabled
                          ? 'cursor-not-allowed opacity-45 text-slate-500'
                          : on
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : 'text-slate-400 hover:bg-slate-800/90 hover:text-white',
                      ].join(' ')}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {on ? (
                        <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-800/80 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-900/80 px-3 py-2.5 ring-1 ring-slate-800/80">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-md">
            {email.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">Admin profile</p>
            <p className="truncate text-[11px] text-slate-500" title={email}>
              {email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )
}
