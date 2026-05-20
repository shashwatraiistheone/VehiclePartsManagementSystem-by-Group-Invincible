import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  ShoppingCart,
  UserPlus,
  Users,
  Receipt,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { StaffViewId } from '../../staff/staffViewId'
import { staffPath } from '../../staff/staffRoutes'
import { getStoredUserName } from '../../lib/auth'
import {
  changeStaffPassword,
  fetchStaffHome,
  type StaffHomeData,
} from '../../services/staffDashboardApi'
import { useToast } from '../ui/ToastProvider'

type StatCard = {
  title: string
  description: string
  count: keyof Pick<
    StaffHomeData,
    'totalCustomers' | 'appointmentsToday' | 'salesToday'
  > | 'activityToday'
  view: StaffViewId
  Icon: typeof LayoutDashboard
}

const STAT_CARDS: StatCard[] = [
  {
    title: 'Staff Dashboard',
    description: 'Analytics & operations',
    count: 'activityToday',
    view: 'dashboard',
    Icon: LayoutDashboard,
  },
  {
    title: 'Customers',
    description: 'Total registered',
    count: 'totalCustomers',
    view: 'manage-customers',
    Icon: Users,
  },
  {
    title: 'Appointments',
    description: 'Scheduled today',
    count: 'appointmentsToday',
    view: 'appointments',
    Icon: CalendarDays,
  },
  {
    title: 'Sales History',
    description: 'Sales recorded today',
    count: 'salesToday',
    view: 'sales-history',
    Icon: Receipt,
  },
]

function cardCount(data: StaffHomeData, key: StatCard['count']): number {
  if (key === 'activityToday') return data.salesToday + data.appointmentsToday
  return data[key]
}

const QUICK_LINKS: { label: string; Icon: typeof KeyRound; action: 'password' | StaffViewId }[] = [
  { label: 'Change Password', Icon: KeyRound, action: 'password' },
  { label: 'Register Customer', Icon: UserPlus, action: 'register-customer' },
  { label: 'Part Requests', Icon: ClipboardList, action: 'part-requests' },
]

function OverviewRow({ label, value, badge }: { label: string; value: ReactNode; badge?: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-slate-900">{value}</div>
        {badge}
      </div>
    </div>
  )
}

function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col items-center rounded-2xl border border-slate-200/90 bg-white px-4 py-6"
        >
          <div className="mb-3 h-12 w-12 rounded-full bg-slate-100" />
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="mt-2 h-7 w-10 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

export function StaffHomePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [data, setData] = useState<StaffHomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const loadHome = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const home = await fetchStaffHome()
      setData(home)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHome()
  }, [loadHome])

  const welcomeName =
    data?.username?.trim() ||
    getStoredUserName()?.trim() ||
    data?.account ||
    'Staff'

  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
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
    navigate(staffPath(action))
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Unable to load home</p>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={() => void loadHome()}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
            Welcome back, {welcomeName} 👋
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
            Here&apos;s what&apos;s happening with your account today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(staffPath('search-sale'))}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-700 hover:to-blue-800"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden />
          New Sale
        </button>
      </div>

      {loading && !data ? (
        <StatCardsSkeleton />
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map(({ title, description, count, view, Icon }) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(staffPath(view))}
              className="group flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white px-4 py-6 text-center shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100 transition group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-100">
                <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="text-sm font-semibold text-slate-900">{title}</span>
              <span className="mt-1 text-2xl font-bold tracking-tight text-blue-600">
                {cardCount(data, count)}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">{description}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Overview</h2>
          {loading && !data ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-50" />
              ))}
            </div>
          ) : data ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <OverviewRow
                label="Your Role"
                value={
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                    {data.role}
                  </span>
                }
              />
              <OverviewRow label="Account" value={data.account} />
              <OverviewRow label="Today's Date" value={todayLabel} />
              <OverviewRow
                label="System Status"
                value={
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
                    {data.systemOnline ? 'Online' : 'Offline'}
                  </span>
                }
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Links</h2>
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
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-blue-500" />
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
