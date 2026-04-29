import { useMemo, useState } from 'react'
import { Check, X, Eye } from 'lucide-react'

export type AppointmentRow = {
  id: string
  customerName: string
  vehicle: string
  appointmentDate: string
  serviceType: string
  status: 'Pending' | 'Completed'
}

const initialRows: AppointmentRow[] = [
  {
    id: '1',
    customerName: 'Nimal Perera',
    vehicle: 'CAB-4521',
    appointmentDate: '2026-05-02',
    serviceType: 'Oil change & inspection',
    status: 'Pending',
  },
  {
    id: '2',
    customerName: 'Sanduni Silva',
    vehicle: 'WP-KA-7788',
    appointmentDate: '2026-05-03',
    serviceType: 'Brake service',
    status: 'Pending',
  },
  {
    id: '3',
    customerName: 'Kasun Fernando',
    vehicle: 'ND-3456',
    appointmentDate: '2026-04-28',
    serviceType: 'Battery replacement',
    status: 'Completed',
  },
]

function statusBadge(status: AppointmentRow['status']) {
  const completed = status === 'Completed'
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        completed
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
          : 'bg-amber-50 text-amber-900 ring-amber-200/80',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

export function AppointmentTable() {
  const [rows, setRows] = useState<AppointmentRow[]>(initialRows)

  const pendingCount = useMemo(() => rows.filter((r) => r.status === 'Pending').length, [rows])

  function approve(id: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Completed' as const } : r)))
  }

  function reject(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-5 py-4 shadow-md">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{pendingCount}</span> pending request
          {pendingCount === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Customer name</th>
                <th className="whitespace-nowrap px-4 py-3">Vehicle</th>
                <th className="whitespace-nowrap px-4 py-3">Appointment date</th>
                <th className="whitespace-nowrap px-4 py-3">Service type</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No appointments scheduled.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{r.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.vehicle}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.appointmentDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.serviceType}</td>
                    <td className="whitespace-nowrap px-4 py-3">{statusBadge(r.status)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {r.status === 'Pending' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => approve(r.id)}
                            className="mr-1 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(r.id)}
                            className="mr-1 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          window.alert(
                            `${r.customerName} — ${r.serviceType} on ${r.appointmentDate}. Connect to detail view when your API is ready.`,
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
