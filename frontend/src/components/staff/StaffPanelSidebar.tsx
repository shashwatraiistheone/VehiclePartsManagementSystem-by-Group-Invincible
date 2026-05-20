import { NavLink } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '../../lib/appBranding'
import {
  Home,
  LayoutDashboard,
  Users,
  ScanSearch,
  UserPlus,
  Receipt,
  CreditCard,
  PieChart,
  CalendarDays,
  Package,
  LogOut,
  Wrench,
  ShieldCheck,
} from 'lucide-react'
import type { StaffViewId } from '../../staff/staffViewId'
import { STAFF_PART_REQUESTS_ENABLED, staffPath } from '../../staff/staffRoutes'
import { getAccountEmailFromToken } from '../../lib/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  id: StaffViewId
  label: string
  Icon: typeof Home
}

type NavGroup = {
  title: string
  items: NavItem[]
}

function buildNavGroups(): NavGroup[] {
  const operations: NavItem[] = [
    { id: 'appointments', label: 'Appointments', Icon: CalendarDays },
  ]
  if (STAFF_PART_REQUESTS_ENABLED) {
    operations.push({ id: 'part-requests', label: 'Part Requests', Icon: Package })
  }

  return [
    {
      title: 'MAIN',
      items: [
        { id: 'home', label: 'Home', Icon: Home },
        { id: 'dashboard', label: 'Staff Dashboard', Icon: LayoutDashboard },
      ],
    },
    {
      title: 'CUSTOMER MANAGEMENT',
      items: [
        { id: 'manage-customers', label: 'Manage Customers', Icon: Users },
        { id: 'search-sale', label: 'Search & Sale', Icon: ScanSearch },
        { id: 'register-customer', label: 'Register Customer', Icon: UserPlus },
        { id: 'community-reviews', label: 'Community Moderation', Icon: ShieldCheck },
      ],
    },
    {
      title: 'SALES & FINANCE',
      items: [
        { id: 'sales-history', label: 'Sales History', Icon: Receipt },
        { id: 'credit-management', label: 'Credit Management', Icon: CreditCard },
        { id: 'customer-reports', label: 'Customer Reports', Icon: PieChart },
      ],
    },
    {
      title: 'OPERATIONS',
      items: operations,
    },
  ]
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  onLogout: () => void
}

// ─── Helper: derive initials from email ───────────────────────────────────────

function getInitials(email: string | null): string {
  if (!email) return 'ST'
  const name = email.split('@')[0]
  const parts = name.split(/[._-]/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getDisplayName(email: string | null): string {
  if (!email) return 'Staff User'
  return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
  ].join(' ')
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StaffPanelSidebar({ onLogout }: Props) {
  const email = getAccountEmailFromToken()
  const initials = getInitials(email)
  const displayName = getDisplayName(email)
  const navGroups = buildNavGroups()

  return (
    <aside className="flex h-full min-h-[min(100dvh,100vh)] w-full flex-col border-r border-white/[0.06] bg-[#0f172a] text-slate-200 shadow-xl md:w-[280px]">
      {/* ── Logo / Brand ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-5">
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl bg-blue-600 shadow-lg shadow-blue-600/35
          "
        >
          <Wrench className="h-[22px] w-[22px] text-white" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-white">{APP_NAME}</p>
          <p className="truncate text-[11px] leading-tight text-gray-400">{APP_TAGLINE}</p>
        </div>

        <span
          className="
            shrink-0 rounded-md border border-blue-400/35
            bg-blue-600/25 px-2 py-0.5
            text-[9px] font-bold uppercase tracking-widest text-blue-200
          "
        >
          STAFF
        </span>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Staff navigation">
        {navGroups.map((group, index) => (
          <div key={group.title}>
            <p
              className={[
                'mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400',
                index === 0 ? 'mt-2' : 'mt-4',
              ].join(' ')}
            >
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ id, label, Icon }) => (
                <li key={id}>
                  <NavLink to={staffPath(id)} className={navLinkClass} end>
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Bottom: User profile + Logout ────────────────────────────────── */}
      <div className="space-y-2 border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5">
          <div
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-full bg-gradient-to-br from-blue-500 to-blue-800
              text-xs font-semibold text-white shadow-md shadow-black/30
              select-none
            "
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-gray-200">{displayName}</p>
            <p className="text-[11px] text-gray-500">
              <span className="font-medium text-gray-500">Role:</span> Staff
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="
            flex w-full items-center justify-center gap-2
            rounded-lg border border-white/[0.08] bg-white/[0.05]
            px-3 py-2 text-sm font-medium text-gray-200
            transition-colors duration-150
            hover:border-red-500/40 hover:bg-red-950/50 hover:text-red-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
          "
        >
          <LogOut className="h-4 w-4 shrink-0 opacity-90" />
          Logout
        </button>
      </div>
    </aside>
  )
}
