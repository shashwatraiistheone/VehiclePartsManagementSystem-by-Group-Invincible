import { Eye, Pencil, Trash2 } from 'lucide-react'

export type CustomerRow = {
  id: number
  name: string
  phone: string
  vehicleNumber: string
  totalPurchases: number
  lastVisit: string
  status: 'Active' | 'Inactive'
}

type Props = {
  rows: CustomerRow[]
  emptyMessage?: string
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

function statusBadge(status: CustomerRow['status']) {
  const isActive = status === 'Active'
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        isActive
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
          : 'bg-slate-100 text-slate-600 ring-slate-200/80',
      ].join(' ')}
    >
      {status}
    </span>
  )
}

export function CustomerTable({ rows, emptyMessage, onView, onEdit, onDelete }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/90 bg-white p-12 text-center text-sm text-slate-500 shadow-md">
        {emptyMessage ?? 'No customers match your search.'}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-md">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="whitespace-nowrap px-4 py-3">Customer Name</th>
              <th className="whitespace-nowrap px-4 py-3">Phone</th>
              <th className="whitespace-nowrap px-4 py-3">Vehicle Number</th>
              <th className="whitespace-nowrap px-4 py-3">Total Purchases</th>
              <th className="whitespace-nowrap px-4 py-3">Last Visit</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="transition hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.phone || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.vehicleNumber}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-800">{r.totalPurchases}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.lastVisit}</td>
                <td className="whitespace-nowrap px-4 py-3">{statusBadge(r.status)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onView(r.id)}
                    className="mr-1 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="ml-1 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
