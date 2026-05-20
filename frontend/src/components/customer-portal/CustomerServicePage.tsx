import { useEffect, useMemo, useState } from 'react'
import { PlusIcon, TruckIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import type { Vehicle } from '../../services/customerApi'
import {
  cancelAppointment,
  fetchMyAppointments,
  type Appointment,
} from '../../services/appointmentApi'
import { useToast } from '../ui/ToastProvider'
import { EmptyState } from './shared'
import type { CustomerNavId } from './types'

type Props = {
  vehicles: Vehicle[]
  appointments: Appointment[]
  onAppointmentsChange: (a: Appointment[]) => void
  onNavigate: (navId: CustomerNavId) => void
}

function formatAppointmentDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCost(cost?: number | null): string {
  if (cost == null || cost <= 0) return '—'
  return `Rs. ${cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function ServiceStatusBadge({ status }: { status: string }) {
  const key = status.trim().toLowerCase()
  const styles: Record<string, string> = {
    completed: 'bg-orange-100 text-orange-800 ring-orange-200/60',
    pending: 'bg-blue-100 text-blue-800 ring-blue-200/60',
    cancelled: 'bg-red-100 text-red-700 ring-red-200/60',
    canceled: 'bg-red-100 text-red-700 ring-red-200/60',
    scheduled: 'bg-emerald-100 text-emerald-800 ring-emerald-200/60',
  }
  const cls = styles[key] ?? 'bg-slate-100 text-slate-700 ring-slate-200/60'
  const label = status.toUpperCase()

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  )
}

function vehicleDisplay(
  appointment: Appointment,
  vehicles: Vehicle[],
): { primary: string; secondary?: string } {
  const match = vehicles.find(
    (v) => v.vehicleNumber.toUpperCase() === appointment.vehicleNumber?.toUpperCase(),
  )
  if (match) {
    return {
      primary: `${match.brand} ${match.model}`,
      secondary: match.vehicleNumber,
    }
  }
  if (appointment.vehicleNumber) {
    return { primary: appointment.vehicleNumber }
  }
  return { primary: '—' }
}

export function CustomerServicePage({
  vehicles,
  appointments: initial,
  onAppointmentsChange,
  onNavigate,
}: Props) {
  const { showToast } = useToast()
  const [appointments, setAppointments] = useState(initial)
  const [refreshing, setRefreshing] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    setAppointments(initial)
  }, [initial])

  async function refresh() {
    setRefreshing(true)
    try {
      const list = await fetchMyAppointments()
      setAppointments(list)
      onAppointmentsChange(list)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load appointments', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const records = useMemo(
    () =>
      [...appointments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments],
  )

  function goToBookService() {
    onNavigate('book-service')
  }

  async function handleCancel(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    if (cancellingId === id) {
      try {
        await cancelAppointment(id)
        showToast('Appointment cancelled.', 'success')
        setCancellingId(null)
        await refresh()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Cancel failed', 'error')
      }
      return
    }
    setCancellingId(id)
    showToast('Click Cancel again to confirm.', 'info')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 px-5 py-5 text-white shadow-md shadow-blue-600/15 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-sm ring-1 ring-white/25">
            <WrenchScrewdriverIcon className="h-5 w-5 text-white" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">Service Records</h1>
            <p className="mt-0.5 text-xs text-blue-100/95 sm:text-sm">
              Track appointments, service status, and workshop visit history.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={goToBookService}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 hover:shadow-md active:scale-[0.98]"
        >
          <PlusIcon className="h-4 w-4 stroke-[2.5]" />
          New Appointment
        </button>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {refreshing ? (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-blue-600/20" aria-hidden>
            <div className="h-full w-1/3 animate-pulse bg-blue-600" />
          </div>
        ) : null}
        {records.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No service records"
              description="Book your first appointment to see your service history here."
              action={
                <button
                  type="button"
                  onClick={goToBookService}
                  className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800"
                >
                  New Appointment
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                    Appointment Date
                  </th>
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                    Vehicle
                  </th>
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                    Service Type
                  </th>
                  <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-5 py-3 text-right text-xs font-semibold text-slate-500">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((a, index) => {
                  const vehicle = vehicleDisplay(a, vehicles)
                  const canCancel = !['cancelled', 'completed', 'canceled'].includes(
                    a.status.toLowerCase(),
                  )
                  return (
                    <tr
                      key={a.id}
                      className={[
                        'group border-b border-slate-100 transition last:border-b-0',
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                        'hover:bg-blue-50/40',
                      ].join(' ')}
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                        {formatAppointmentDate(a.date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <TruckIcon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {vehicle.primary}
                            </p>
                            {vehicle.secondary ? (
                              <p className="truncate text-xs text-slate-500">{vehicle.secondary}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700">{a.serviceType}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <ServiceStatusBadge status={a.status} />
                          {canCancel ? (
                            <button
                              type="button"
                              onClick={(e) => void handleCancel(a.id, e)}
                              className={[
                                'text-[10px] font-semibold transition group-hover:inline',
                                cancellingId === a.id
                                  ? 'text-red-700 underline'
                                  : 'hidden text-red-600 opacity-0 hover:underline group-hover:opacity-100',
                              ].join(' ')}
                            >
                              {cancellingId === a.id ? 'Confirm cancel' : 'Cancel'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold text-slate-900">
                        {formatCost(a.estimatedCost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
