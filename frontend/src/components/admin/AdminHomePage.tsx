import { useState, type FormEvent, type ReactNode } from 'react'
import {
  BarChart3,
  Boxes,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  Receipt,
  Shield,
  ShoppingCart,
  UserPlus,
  UserSquare2,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AdminPageId } from '../../admin/adminPages'
import { getAccountEmailFromToken, getStoredUserName } from '../../lib/auth'
import { changeStaffPassword } from '../../services/staffDashboardApi'
import { useToast } from '../ui/ToastProvider'

type Props = {
  onNavigate: (id: AdminPageId) => void
}

type QuickCard = {
  title: string
  page: AdminPageId
  Icon: LucideIcon
}

const QUICK_CARDS: QuickCard[] = [
  { title: 'Staff Dashboard', page: 'staff-dashboard', Icon: LayoutDashboard },
  { title: 'Customers', page: 'customers', Icon: Users },
  { title: 'Appointments', page: 'appointments', Icon: CalendarDays },
  { title: 'Sales History', page: 'sales-history', Icon: Receipt },
  { title: 'Admin Dashboard', page: 'admin-dashboard', Icon: Shield },
  { title: 'Manage Parts', page: 'inventory', Icon: Boxes },
  { title: 'Manage Staff', page: 'staff-management', Icon: UserSquare2 },
  { title: 'Reports', page: 'customer-reports', Icon: BarChart3 },
]

const QUICK_LINKS: {
  label: string
  Icon: typeof KeyRound
  action: 'password' | AdminPageId
}[] = [
  { label: 'Change Password', Icon: KeyRound, action: 'password' },
  { label: 'Register Customer', Icon: UserPlus, action: 'register-customer' },
  { label: 'Part Requests', Icon: ClipboardList, action: 'part-requests' },
]

function OverviewRow({ label, value, badge }: { label: string; value: ReactNode; badge?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-slate-900">{value}</div>
        {badge}
      </div>
    </div>
  )
}

export function AdminHomePage({ onNavigate }: Props) {
  const { showToast } = useToast()
  const email = getAccountEmailFromToken() ?? 'admin'
  const accountLabel = getStoredUserName()?.trim() || email.split('@')[0] || 'admin'

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      showToast('New passwords do not match.', 'error')
      return
    }
    setSavingPassword(true)
    try {
      await changeStaffPassword(currentPw, newPw)
      showToast('Password updated successfully.', 'success')
      setShowPasswordModal(false)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update password', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  function handleQuickLink(action: (typeof QUICK_LINKS)[number]['action']) {
    if (action === 'password') {
      setShowPasswordModal(true)
      return
    }
    onNavigate(action)
  }

  return (
    <div className="animate-in fade-in space-y-8 duration-300">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Welcome</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem]">
            Welcome back, {accountLabel}! 👋
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('search-sale')}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          New Sale
        </button>
      </header>

      <section aria-label="Quick access">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_CARDS.map(({ title, page, Icon }) => (
            <button
              key={title}
              type="button"
              onClick={() => onNavigate(page)}
              className="group flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white px-5 py-8 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 ring-1 ring-slate-200/80 transition group-hover:from-blue-50 group-hover:to-blue-100/80 group-hover:text-blue-600 group-hover:ring-blue-200/60">
                <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-sm font-bold text-slate-900">{title}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-5 text-base font-bold text-slate-900">Quick Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewRow
              label="Your Role"
              value={
                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                  Administrator
                </span>
              }
            />
            <OverviewRow label="Today's Date" value={todayLabel} />
            <OverviewRow label="Account" value={accountLabel} />
            <OverviewRow
              label="System Status"
              value={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                  Online
                </span>
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Quick Links</h2>
          <ul className="divide-y divide-slate-100">
            {QUICK_LINKS.map(({ label, Icon, action }) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => handleQuickLink(action)}
                  className="group flex w-full items-center gap-3 py-3.5 text-left transition hover:text-blue-600"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800 group-hover:text-blue-700">
                    {label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {showPasswordModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={(e) => void savePassword(e)} className="space-y-3 p-5">
              <label className="block text-sm font-medium text-slate-700">
                Current password
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                  autoComplete="current-password"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                New password
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Confirm new password
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  required
                  autoComplete="new-password"
                />
              </label>
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
