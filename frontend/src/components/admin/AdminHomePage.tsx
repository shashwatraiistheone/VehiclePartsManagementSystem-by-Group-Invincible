import {
  Gauge,
  Users,
  CalendarDays,
  CreditCard,
  BarChart3,
  Settings2,
  UserSquare2,
  LineChart,
  ShoppingCart,
  Info,
  Zap,
  KeyRound,
  UserPlus,
} from 'lucide-react'
import type { AdminPageId } from '../../admin/adminPages'
import { getAccountEmailFromToken } from '../../lib/auth'
import { DashboardFeatureCard } from './DashboardFeatureCard'
import { SystemAlerts } from '../dashboard/SystemAlerts'

type HomeCard = {
  title: string
  Icon: typeof Gauge
  target?: AdminPageId
  highlight?: boolean
}

const cards: HomeCard[] = [
  { title: 'Staff Dashboard', Icon: Gauge, target: 'staff-dashboard' },
  { title: 'Customers', Icon: Users, target: 'customers' },
  { title: 'Appointments', Icon: CalendarDays, target: 'appointments' },
  { title: 'Sales History', Icon: CreditCard, target: 'sales-history' },
  { title: 'Admin Dashboard', Icon: BarChart3, target: 'admin-dashboard' },
  { title: 'Manage Parts', Icon: Settings2, target: 'inventory', highlight: true },
  { title: 'Manage Staff', Icon: UserSquare2, target: 'staff-management' },
  { title: 'Reports', Icon: LineChart, target: 'customer-reports' },
]

function displayAccountLabel(): string {
  const email = getAccountEmailFromToken()
  if (!email) return 'admin'
  const local = email.split('@')[0]
  return local || 'admin'
}

type Props = {
  onNavigate: (id: AdminPageId) => void
}

export function AdminHomePage({ onNavigate }: Props) {
  const accountLabel = displayAccountLabel()
  const accountFull = getAccountEmailFromToken() ?? 'admin'
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="w-full min-w-0 space-y-8">
      {/* Header — justify-between + items-center on md+ */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {accountLabel}! 👋
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('search-sale')}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          New Sale
        </button>
      </header>

      {/* Real-time System Alerts & Reminders */}
      <SystemAlerts />

      {/* Feature grid — 1 col mobile, 2 from md; equal row heights */}
      <section aria-label="Modules">
        <div className="grid min-w-0 auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <DashboardFeatureCard
              key={c.title}
              title={c.title}
              Icon={c.Icon}
              highlight={c.highlight}
              onClick={() => c.target && onNavigate(c.target)}
            />
          ))}
        </div>
      </section>

      {/* Quick Overview + Quick Links — balanced panels, same shell */}
      <section aria-label="Overview and shortcuts" className="mt-8">
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-md md:min-h-[300px]">
            <h2 className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-800">
              <Info className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
              Quick Overview
            </h2>
            <div className="mt-6 grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex min-h-[88px] flex-col justify-center rounded-xl border border-slate-100 bg-gray-50/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Your role</p>
                <p className="mt-2">
                  <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-800">
                    Administrator
                  </span>
                </p>
              </div>
              <div className="flex min-h-[88px] flex-col justify-center rounded-xl border border-slate-100 bg-gray-50/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Account</p>
                <p className="mt-2 truncate text-sm font-semibold text-slate-900" title={accountFull || undefined}>
                  {accountLabel}
                </p>
              </div>
              <div className="flex min-h-[88px] flex-col justify-center rounded-xl border border-slate-100 bg-gray-50/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Today&apos;s date
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{today}</p>
              </div>
              <div className="flex min-h-[88px] flex-col justify-center rounded-xl border border-slate-100 bg-gray-50/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">System status</p>
                <p className="mt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    Online
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-md md:min-h-[300px]">
            <h2 className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-800">
              <Zap className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              Quick Links
            </h2>
            <div className="mt-6 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-gray-50/50">
              <ul className="flex min-h-0 flex-1 flex-col divide-y divide-slate-200/80">
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      window.alert(
                        'Change password: connect this action to your account security API when ready.',
                      )
                    }
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-white"
                  >
                    <KeyRound className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                    Change Password
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('register-customer')}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-white"
                  >
                    <UserPlus className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                    Register Customer
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onNavigate('appointments')}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-slate-700 transition hover:bg-white"
                  >
                    <CalendarDays className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                    Appointments
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200/90 pt-8">
        <p className="text-xs text-slate-500">© PartsHub. All rights reserved.</p>
      </footer>
    </div>
  )
}
