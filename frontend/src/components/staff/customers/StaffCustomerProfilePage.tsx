import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Award, DollarSign, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  fetchCustomerDetail,
  fetchCustomerHistory,
  fetchVehicles,
  type CustomerDetail,
  type CustomerHistory,
  type Vehicle,
} from '../../../services/customerApi'
import { fetchCustomerLoyalty, type CustomerLoyalty } from '../../../services/loyaltyApi'
import { fetchPartRequestsByCustomer, type PartRequest } from '../../../services/partRequestApi'
import { staffPath } from '../../../staff/staffRoutes'
import { StaffCustomerEditModal, type StaffCustomerRecord } from './StaffCustomerEditModal'
import { formatMoney } from '../../../utils/formatUsd'

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

function formatCustomerSince(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

export function StaffCustomerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const customerId = Number(id)

  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null)
  const [history, setHistory] = useState<CustomerHistory | null>(null)
  const [partRequests, setPartRequests] = useState<PartRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isFinite(customerId) || customerId <= 0) {
      setError('Invalid customer.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [d, v, l, h, pr] = await Promise.all([
        fetchCustomerDetail(customerId),
        fetchVehicles(customerId),
        fetchCustomerLoyalty(customerId),
        fetchCustomerHistory(customerId),
        fetchPartRequestsByCustomer(customerId),
      ])
      setDetail(d)
      setVehicles(v)
      setLoyalty(l)
      setHistory(h)
      setPartRequests(pr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer profile')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void load()
  }, [load])

  const editRecord: StaffCustomerRecord | null = detail
    ? {
        id: detail.id,
        name: detail.name,
        phone: detail.phone,
        address: detail.address,
        email: detail.email,
      }
    : null

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" aria-hidden />
        <p className="text-sm text-slate-500">Loading customer profile…</p>
      </div>
    )
  }

  if (error || !detail || !loyalty) {
    return (
      <div className="space-y-4">
        <Link
          to={staffPath('manage-customers')}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Manage Customers
        </Link>
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error ?? 'Customer not found.'}
        </div>
      </div>
    )
  }

  const recentPurchases = history?.purchases.slice(0, 5) ?? []
  const recentAppointments = history?.services.slice(0, 5) ?? []
  const recentPartRequests = partRequests.slice(0, 5)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to={staffPath('manage-customers')}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Manage Customers
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Profile: {detail.name}
          </h1>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,35%)_minmax(0,65%)]">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-5 py-6 text-white">
              <div className="space-y-4">
                <InfoRow label="Phone Number" value={formatPhone(detail.phone)} />
                <InfoRow label="Email Address" value={detail.email} />
                <InfoRow label="Physical Address" value={detail.address || '—'} />
                <InfoRow
                  label="Customer Since"
                  value={formatCustomerSince(detail.createdAt)}
                />
              </div>
            </div>
            <div className="p-4">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="w-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/30 transition hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 hover:shadow-lg hover:shadow-orange-500/40"
              >
                Edit Info
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Lifetime Value</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Award className="h-4 w-4 text-indigo-500" aria-hidden />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Points</span>
                </div>
                <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
                  {loyalty.loyaltyPoints.toLocaleString()}{' '}
                  <span className="text-sm font-semibold text-slate-500">PTS</span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <DollarSign className="h-4 w-4 text-emerald-600" aria-hidden />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Total Spend</span>
                </div>
                <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
                  {formatMoney(loyalty.totalSpent)}
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100/90">
              Loyalty Program
            </p>
            <p className="mt-2 text-sm font-semibold leading-snug">
              {loyalty.discountPercent}% discount on purchases over Rs.{' '}
              {loyalty.orderThreshold.toLocaleString()}
            </p>
            <div className="mt-4 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/15">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-100/80">
                Next loyalty discount
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/95">
                {loyalty.nextDiscountMessage}
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${loyalty.progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-blue-100/80">
              Tier: <span className="font-semibold text-white">{loyalty.tier}</span>
            </p>
          </section>
        </div>

        <div className="space-y-4">
          <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-5 py-4">
              <h2 className="text-base font-bold text-white">Registered Vehicles</h2>
              <p className="mt-0.5 text-xs text-blue-100">
                {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} on file
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3">License Plate</th>
                    <th className="px-4 py-3">Make &amp; Model</th>
                    <th className="px-5 py-3">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-slate-500">
                        No vehicles registered.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-5 py-3.5">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-800 shadow-sm ring-1 ring-slate-200/80">
                            {v.vehicleNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {v.brand} {v.model}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{v.year}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {recentPurchases.length > 0 ? (
            <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Recent Purchases</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {recentPurchases.map((p) => (
                  <li key={p.saleId} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-slate-800">Sale #{p.saleId}</span>
                    <span className="text-slate-500">
                      {formatMoney(p.finalAmount)} · {formatShortDate(p.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {recentAppointments.length > 0 ? (
            <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Appointment History</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {recentAppointments.map((a) => (
                  <li
                    key={a.appointmentId}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="font-medium text-slate-800">{a.serviceType}</span>
                    <span className="text-slate-500">
                      {a.status} · {formatShortDate(a.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {recentPartRequests.length > 0 ? (
            <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Part Requests</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {recentPartRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="font-medium text-slate-800">{r.partName}</span>
                    <span className="text-slate-500">
                      {r.status} · {formatShortDate(r.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {editOpen && editRecord ? (
        <StaffCustomerEditModal
          customer={editRecord}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            void load()
            setEditOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
