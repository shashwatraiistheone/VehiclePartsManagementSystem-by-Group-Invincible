import { useCallback, useState } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Gift,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PieChart,
  Receipt,
  ScanSearch,
  ScrollText,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
  UserSquare2,
  Wallet,
  Mail,
  Wrench,
  X,
} from 'lucide-react'
import type { AdminPageId } from '../../admin/adminPages'
import { isAdminSidebarPending } from '../../admin/adminPages'
import { APP_NAME } from '../../lib/appBranding'
import { getAccountEmailFromToken } from '../../lib/auth'

type NavItem = {
  id: AdminPageId
  label: string
  Icon: typeof CalendarDays
}

type Section = { title: string; items: NavItem[] }

const sections: Section[] = [
  {
    title: 'Main',
    items: [
      { id: 'home', label: 'Home', Icon: Home },
      { id: 'staff-dashboard', label: 'Staff Dashboard', Icon: LayoutDashboard },
      { id: 'admin-dashboard', label: 'Admin Dashboard', Icon: Shield },
    ],
  },
  {
    title: 'Customer Management',
    items: [
      { id: 'customers', label: 'Manage Customers', Icon: Users },
      { id: 'search-sale', label: 'Search & Sale', Icon: ScanSearch },
      { id: 'register-customer', label: 'Register Customer', Icon: UserPlus },
    ],
  },
  {
    title: 'Sales & Finance',
    items: [
      { id: 'sales-history', label: 'Sales History', Icon: Receipt },
      { id: 'credit-management', label: 'Credit Management', Icon: Wallet },
      { id: 'customer-reports', label: 'Customer Reports', Icon: PieChart },
    ],
  },
  {
    title: 'Operations',
    items: [
      { id: 'appointments', label: 'Appointments', Icon: CalendarDays },
      { id: 'part-requests', label: 'Part Requests', Icon: ClipboardList },
    ],
  },
  {
    title: 'Administration',
    items: [
      { id: 'staff-management', label: 'Manage Staff', Icon: UserSquare2 },
      { id: 'vendors', label: 'Manage Vendors', Icon: Building2 },
      { id: 'inventory', label: 'Manage Parts', Icon: Package },
      { id: 'purchases', label: 'Purchase Invoices', Icon: FileText },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      { id: 'financial-reports', label: 'Financial Reports', Icon: BarChart3 },
      { id: 'daily-performance-report', label: 'Daily Report', Icon: BarChart3 },
      { id: 'monthly-performance-report', label: 'Monthly Report', Icon: BarChart3 },
      { id: 'monthly-top-selling-parts', label: 'Top Selling Parts', Icon: Package },
      { id: 'annual-strategic-review', label: 'Annual Review', Icon: PieChart },
      { id: 'loyalty-program', label: 'Loyalty Program', Icon: Gift },
      { id: 'community-reviews', label: 'Community Moderation', Icon: ShieldCheck },
      { id: 'audit-logs', label: 'System Audit Logs', Icon: ScrollText },
      { id: 'email-reminder-logs', label: 'Email Reminder Logs', Icon: Mail },
      { id: 'background-jobs', label: 'Jobs Dashboard', Icon: Activity },
    ],
  },
]

type Props = {
  active: AdminPageId
  onSelect: (id: AdminPageId) => void
  onLogout: () => void
}

function displayUsername(email: string) {
  const local = email.split('@')[0]?.trim()
  return local || 'admin'
}

function NavButton({
  item,
  active,
  collapsed,
  onSelect,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
  onSelect: (id: AdminPageId) => void
}) {
  const { id, label, Icon } = item
  const pending = isAdminSidebarPending(id)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(id)}
        title={collapsed ? label : undefined}
        className={[
          'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
          active
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 ring-1 ring-primary-500/40'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
          collapsed ? 'justify-center px-2.5' : '',
        ].join(' ')}
      >
        <Icon
          className={[
            'h-[18px] w-[18px] shrink-0',
            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200',
          ].join(' ')}
          aria-hidden
        />
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {pending ? (
              <span className="shrink-0 rounded-md bg-slate-700/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Soon
              </span>
            ) : null}
          </>
        ) : null}
      </button>
    </li>
  )
}

function SidebarContent({
  active,
  collapsed,
  onSelect,
  onLogout,
  onNavigateHome,
  onCloseMobile,
}: {
  active: AdminPageId
  collapsed: boolean
  onSelect: (id: AdminPageId) => void
  onLogout: () => void
  onNavigateHome: () => void
  onCloseMobile?: () => void
}) {
  const email = getAccountEmailFromToken() ?? 'admin@partshub.local'
  const username = displayUsername(email)

  const handleSelect = useCallback(
    (id: AdminPageId) => {
      onSelect(id)
      onCloseMobile?.()
    },
    [onSelect, onCloseMobile],
  )

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-4">
        <button
          type="button"
          onClick={() => {
            onNavigateHome()
            onCloseMobile?.()
          }}
          className={[
            'flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity hover:opacity-90',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
          aria-label={`${APP_NAME} home`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-white shadow-lg shadow-purple-900/40 ring-1 ring-violet-400/30">
            <Wrench className="h-5 w-5" aria-hidden />
          </span>
          {!collapsed ? (
            <span className="truncate text-base font-bold tracking-tight text-white">{APP_NAME}</span>
          ) : null}
        </button>
        {onCloseMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </header>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        {sections.map((section) => (
          <section key={section.title}>
            {!collapsed ? (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {section.title}
              </p>
            ) : (
              <div className="mb-2 border-t border-white/[0.06] pt-2 first:border-0 first:pt-0" aria-hidden />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={active === item.id}
                  collapsed={collapsed}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          </section>
        ))}
      </nav>

      <footer className="mt-auto shrink-0 space-y-2 border-t border-white/[0.06] p-3">
        <div
          className={[
            'flex items-center gap-3 rounded-xl bg-slate-800/80 px-3 py-2.5 ring-1 ring-white/[0.06]',
            collapsed ? 'justify-center px-2' : '',
          ].join(' ')}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-md">
            {username.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{username}</span>
              <span className="block text-[11px] text-slate-400">Administrator</span>
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? 'Logout' : undefined}
          className={[
            'flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-slate-800/50 px-3 py-2.5 text-sm font-medium text-slate-300 shadow-sm transition-all duration-200 hover:border-red-500/30 hover:bg-red-950/40 hover:text-red-200',
            collapsed ? 'px-2' : '',
          ].join(' ')}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </footer>
    </>
  )
}

export function AdminPanelSidebar({ active, onSelect, onLogout }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const navigateHome = useCallback(() => onSelect('home'), [onSelect])

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 truncate font-bold text-slate-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 text-white">
            <Wrench className="h-4 w-4" />
          </span>
          {APP_NAME}
        </span>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar panel */}
      <aside
        className={[
          'flex h-full min-h-[min(100dvh,100vh)] flex-col bg-[#0f172a] text-slate-200 shadow-xl transition-all duration-200',
          'fixed inset-y-0 left-0 z-50 w-[280px] md:relative md:z-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[72px] lg:w-[72px]' : 'md:w-[280px] lg:w-[280px]',
        ].join(' ')}
      >
        <SidebarContent
          active={active}
          collapsed={collapsed}
          onSelect={onSelect}
          onLogout={onLogout}
          onNavigateHome={navigateHome}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Tablet collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 shadow-md transition hover:bg-slate-800 hover:text-white md:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>
    </>
  )
}
