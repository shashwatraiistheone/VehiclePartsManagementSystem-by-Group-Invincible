import type { ReactNode } from 'react'
import {
  CalendarDaysIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
  TruckIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import type { Appointment } from '../../services/appointmentApi'
import type { CustomerDetail, CustomerHistory } from '../../services/customerApi'
import type { PartRequest } from '../../services/partRequestApi'
import { computeLoyaltyProgress } from './LoyaltyRewardsCard'
import type { CustomerNavId } from './types'
import { formatDate, formatMoney, StatusBadge } from './shared'

type Props = {
  customerName: string
  profile: CustomerDetail
  history: CustomerHistory
  appointments: Appointment[]
  partRequests: PartRequest[]
  onNavigate: (navId: CustomerNavId) => void
}

type ShortcutCard = {
  navId: CustomerNavId
  label: string
  description: string
  Icon: typeof Squares2X2Icon
}

const SHORTCUT_CARDS: ShortcutCard[] = [
  {
    navId: 'dashboard',
    label: 'My Dashboard',
    description: 'Analytics & rewards',
    Icon: Squares2X2Icon,
  },
  {
    navId: 'profile-vehicles',
    label: 'My Profile',
    description: 'Account & contact',
    Icon: UserCircleIcon,
  },
  {
    navId: 'my-appointments',
    label: 'My Appointments',
    description: 'Book & manage visits',
    Icon: CalendarDaysIcon,
  },
  {
    navId: 'purchase-history',
    label: 'Purchase History',
    description: 'Parts & invoices',
    Icon: ShoppingBagIcon,
  },
]

const QUICK_LINKS: { navId: CustomerNavId; label: string; Icon: typeof CalendarDaysIcon }[] = [
  { navId: 'book-service', label: 'Request Appointment', Icon: CalendarDaysIcon },
  { navId: 'community-reviews', label: 'Community Feedback', Icon: StarIcon },
  { navId: 'ai-suggestions', label: 'Maintenance AI', Icon: SparklesIcon },
  { navId: 'request-part', label: 'Request a Part', Icon: ClipboardDocumentListIcon },
]

function OverviewRow({
  label,
  value,
  badge,
}: {
  label: string
  value: ReactNode
  badge?: ReactNode
}) {
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

export function CustomerHome({
  customerName,
  profile,
  history,
  appointments,
  partRequests,
  onNavigate,
}: Props) {
  const upcoming = appointments
    .filter(
      (a) =>
        new Date(a.date) >= new Date() &&
        !['cancelled', 'completed'].includes(a.status.toLowerCase()),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const nextAppointment = upcoming[0] ?? null
  const recentPurchase = history.purchases[0] ?? null
  const pendingRequests = partRequests.filter((r) => r.status === 'Pending')
  const loyalty = computeLoyaltyProgress(history)
  const primaryVehicle = profile.vehicles[0]

  const firstName = customerName.trim().split(/\s+/)[0] || 'Customer'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
            Here&apos;s what&apos;s happening with your vehicles, appointments, and parts orders today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('book-service')}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <WrenchScrewdriverIcon className="h-4 w-4" />
          Book Service
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SHORTCUT_CARDS.map(({ navId, label, description, Icon }) => (
          <button
            key={navId}
            type="button"
            onClick={() => onNavigate(navId)}
            className="group flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white px-4 py-6 text-center shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100 transition group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:ring-blue-100">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-sm font-semibold text-slate-900">{label}</span>
            <span className="mt-1 text-xs text-slate-500">{description}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Quick Overview</h2>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              View updates
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <OverviewRow
              label="Next appointment"
              value={
                nextAppointment ? (
                  <>
                    {nextAppointment.serviceType}
                    <span className="block text-xs font-normal text-slate-500">
                      {formatDate(nextAppointment.date)}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">No upcoming visits</span>
                )
              }
              badge={
                nextAppointment ? <StatusBadge status={nextAppointment.status} /> : undefined
              }
            />
            <OverviewRow
              label="Loyalty status"
              value={loyalty.isEligible ? '10% discount unlocked' : 'Working toward reward'}
              badge={
                <StatusBadge status={loyalty.isEligible ? 'Active' : 'In progress'} />
              }
            />
            <OverviewRow
              label="Recent purchase"
              value={
                recentPurchase ? (
                  <>
                    Sale #{recentPurchase.saleId} · {formatMoney(recentPurchase.finalAmount)}
                    <span className="block text-xs font-normal text-slate-500">
                      {formatDate(recentPurchase.date)}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">No purchases yet</span>
                )
              }
            />
            <OverviewRow
              label="Pending requests"
              value={
                pendingRequests.length > 0
                  ? `${pendingRequests.length} part request${pendingRequests.length > 1 ? 's' : ''} awaiting response`
                  : 'No pending part requests'
              }
              badge={
                pendingRequests.length > 0 ? (
                  <StatusBadge status="Pending" />
                ) : (
                  <StatusBadge status="Clear" />
                )
              }
            />
            <OverviewRow
              label="Vehicle summary"
              value={
                profile.vehicles.length > 0 ? (
                  <>
                    {profile.vehicles.length} registered vehicle
                    {profile.vehicles.length > 1 ? 's' : ''}
                    {primaryVehicle ? (
                      <span className="block text-xs font-normal text-slate-500">
                        Primary: {primaryVehicle.vehicleNumber} · {primaryVehicle.brand}{' '}
                        {primaryVehicle.model}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-slate-500">Add a vehicle to get started</span>
                )
              }
              badge={
                profile.vehicles.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <TruckIcon className="h-3.5 w-3.5" />
                  </span>
                ) : undefined
              }
            />
            <OverviewRow
              label="Account balance"
              value={
                profile.pendingCredits.length > 0
                  ? `${profile.pendingCredits.length} unpaid invoice${profile.pendingCredits.length > 1 ? 's' : ''}`
                  : 'All invoices paid'
              }
              badge={
                profile.pendingCredits.length > 0 ? (
                  <StatusBadge status="Due" />
                ) : (
                  <StatusBadge status="Paid" />
                )
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Quick Links</h2>
          <ul className="divide-y divide-slate-100">
            {QUICK_LINKS.map(({ navId, label, Icon }) => (
              <li key={navId}>
                <button
                  type="button"
                  onClick={() => onNavigate(navId)}
                  className="group flex w-full items-center gap-3 py-3.5 text-left transition hover:text-blue-600"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-800 group-hover:text-blue-700">
                    {label}
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-slate-300 transition group-hover:text-blue-500" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
            {loyalty.isEligible
              ? 'You qualify for 10% loyalty discount on single orders over Rs 5,000.'
              : 'Place an order over Rs 5,000 to unlock your 10% loyalty discount.'}
          </p>
        </section>
      </div>
    </div>
  )
}
