import { useState } from 'react'
import {
  BanknotesIcon,
  CalendarDaysIcon,
  PencilIcon,
  PlusIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import {
  deleteVehicle,
  fetchVehicles,
  type CustomerDetail,
  type CustomerHistory,
  type Vehicle,
} from '../../services/customerApi'
import type { Appointment } from '../../services/appointmentApi'
import { useToast } from '../ui/ToastProvider'
import {
  computeLoyaltyProgress,
  LOYALTY_ORDER_THRESHOLD,
  LoyaltyRewardsCard,
} from './LoyaltyRewardsCard'
import { DashboardTopSection } from './DashboardTopSection'
import { SpendingTrendCard } from './SpendingTrendCard'
import type { MaintenancePrediction } from '../../services/predictionApi'
import type { CustomerNavId } from './types'
import { EmptyState, formatDate, formatMoney, SectionCard, StatCard, StatusBadge } from './shared'

type Props = {
  customerId: number
  customerName: string
  profile: CustomerDetail
  history: CustomerHistory
  vehicles: Vehicle[]
  appointments: Appointment[]
  predictions: MaintenancePrediction[]
  predictionsError?: string | null
  onVehiclesChange: (v: Vehicle[]) => void
  onNavigate: (navId: CustomerNavId) => void
}

function paymentStatusForSale(
  saleId: number,
  pendingCredits: CustomerDetail['pendingCredits'],
): { label: string; badge: string } {
  const credit = pendingCredits.find((c) => c.saleId === saleId)
  if (credit) return { label: 'Credit due', badge: 'Due' }
  return { label: 'Paid', badge: 'Paid' }
}

export function CustomerMyDashboard({
  customerId,
  customerName,
  profile,
  history,
  vehicles,
  appointments,
  predictions,
  predictionsError = null,
  onVehiclesChange,
  onNavigate,
}: Props) {
  const { showToast } = useToast()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const loyalty = computeLoyaltyProgress(history)
  const loyaltyPoints = loyalty.qualifyingOrderCount * 100 + loyalty.progressPercent
  const loyaltyTier = loyalty.isEligible ? 'Gold Member' : 'Standard'

  const recentPurchases = history.purchases.slice(0, 6)
  const upcomingAppointments = appointments
    .filter(
      (a) =>
        new Date(a.date) >= new Date() &&
        !['cancelled', 'completed'].includes(a.status.toLowerCase()),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  async function handleDeleteVehicle(id: number) {
    if (!window.confirm('Remove this vehicle from your account?')) return
    setDeletingId(id)
    try {
      await deleteVehicle(customerId, id)
      const updated = await fetchVehicles(customerId)
      onVehiclesChange(updated)
      showToast('Vehicle removed.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <DashboardTopSection
        customerName={customerName}
        predictions={predictions}
        error={predictionsError}
      />

      {/* 1. Top statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Purchases"
          value={String(profile.totalPurchases)}
          sub="Completed orders"
          Icon={ShoppingBagIcon}
          accent="from-blue-500 to-blue-600"
        />
        <StatCard
          label="Total Spent"
          value={formatMoney(profile.totalSpent)}
          sub="Lifetime spend"
          Icon={BanknotesIcon}
          accent="from-emerald-500 to-emerald-600"
        />
        <StatCard
          label="Loyalty Points"
          value={String(loyaltyPoints)}
          sub={loyalty.isEligible ? 'Reward unlocked' : `${loyalty.progressPercent}% progress`}
          Icon={SparklesIcon}
          accent="from-violet-500 to-indigo-600"
        />
        <StatCard
          label="My Vehicles"
          value={String(vehicles.length)}
          sub={vehicles.length === 1 ? 'Registered vehicle' : 'Registered vehicles'}
          Icon={TruckIcon}
          accent="from-slate-600 to-slate-700"
        />
      </div>

      {/* 2. Recent purchases */}
      <SectionCard
        title="Recent Purchases"
        action={
          <button
            type="button"
            onClick={() => onNavigate('purchase-history')}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            View all
          </button>
        }
      >
        {recentPurchases.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="Your order history will appear here after your first parts purchase."
          />
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Order</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Payment</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPurchases.map((p) => {
                  const pay = paymentStatusForSale(p.saleId, profile.pendingCredits)
                  return (
                    <tr key={p.saleId} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-4 font-medium text-slate-900">#{p.saleId}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(p.date)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={pay.badge} />
                        <span className="sr-only">{pay.label}</span>
                      </td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        {formatMoney(p.finalAmount)}
                        {p.discount > 0 ? (
                          <span className="mt-0.5 block text-xs font-normal text-emerald-600">
                            −{formatMoney(p.discount)} loyalty
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* 3 & 4. Vehicles + Appointments */}
      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="My Vehicles"
          action={
            <button
              type="button"
              onClick={() => onNavigate('add-vehicle')}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add Vehicle
            </button>
          }
        >
          {vehicles.length === 0 ? (
            <EmptyState
              title="No vehicles registered"
              description="Add a vehicle to book services and track maintenance."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('add-vehicle')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Add Vehicle
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {vehicles.map((v) => (
                <li
                  key={v.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3 transition hover:border-slate-200"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-100">
                      <TruckIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{v.vehicleNumber}</p>
                      <p className="text-xs text-slate-600">
                        {v.brand} {v.model}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {v.year} · {v.mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => onNavigate('profile-vehicles')}
                      className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-blue-600"
                      aria-label="Edit vehicle"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === v.id}
                      onClick={() => void handleDeleteVehicle(v.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete vehicle"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming Appointments"
          action={
            <button
              type="button"
              onClick={() => onNavigate('my-appointments')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View all
            </button>
          }
        >
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming visits"
              description="Book a service appointment when you're ready."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('book-service')}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Book Service
                </button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {upcomingAppointments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3"
                >
                  <div className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                      <CalendarDaysIcon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.serviceType}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.date)}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* 5. Loyalty rewards */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LoyaltyRewardsCard history={history} />
        </div>
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Loyalty summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Current tier</dt>
              <dd className="font-semibold text-slate-900">{loyaltyTier}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Points</dt>
              <dd className="font-semibold text-blue-600">{loyaltyPoints}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Discount</dt>
              <dd className="font-semibold text-slate-900">10% over {formatMoney(LOYALTY_ORDER_THRESHOLD)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Progress</dt>
              <dd className="font-semibold text-slate-900">
                {loyalty.isEligible ? 'Unlocked' : `${loyalty.progressPercent}%`}
              </dd>
            </div>
          </dl>
          {!loyalty.isEligible ? (
            <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800">
              Spend {formatMoney(loyalty.remainingAmount)} more on a single order to unlock 10% OFF.
            </p>
          ) : (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs leading-relaxed text-emerald-800">
              Your 10% loyalty discount is active on qualifying orders.
            </p>
          )}
        </section>
      </div>

      {/* Spending trend — full width at bottom of dashboard */}
      <SpendingTrendCard history={history} />
    </div>
  )
}
