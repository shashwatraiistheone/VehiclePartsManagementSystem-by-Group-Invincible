import { X } from 'lucide-react'
import type { InventoryPart } from '../../services/partsApi'
import { stockLevelLabel } from '../../services/partsApi'

type Props = {
  part: InventoryPart
  onClose: () => void
  onEdit: (part: InventoryPart) => void
}

function formatMoney(amount: number) {
  return `Rs ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

export function PartViewModal({ part, onClose, onEdit }: Props) {
  const stock = stockLevelLabel(part.quantity)
  const active = part.isActive && part.status.toLowerCase() !== 'inactive'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Part details</h2>
            <p className="text-sm text-slate-500">{part.partNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Detail label="Part number" value={part.partNumber} />
          <Detail label="Name" value={part.name} />
          <Detail label="Category" value={part.category} />
          <Detail label="Vendor" value={part.vendorName} />
          <Detail label="Price" value={formatMoney(part.price)} />
          <Detail label="Stock level" value={`${part.quantity} · ${stock.label}`} />
          <Detail label="Status" value={active ? 'Active' : 'Inactive'} />
          <Detail
            label="Added"
            value={
              part.createdAt
                ? new Date(part.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'
            }
          />
        </dl>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(part)
            }}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:from-blue-500 hover:to-violet-500"
          >
            Edit part
          </button>
        </div>
      </div>
    </div>
  )
}
