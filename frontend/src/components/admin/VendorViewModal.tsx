import { X } from 'lucide-react'
import type { Vendor } from '../../services/vendorApi'
import { formatMoney } from '../../utils/formatUsd'

type Props = {
  vendor: Vendor
  onClose: () => void
  onEdit: (vendor: Vendor) => void
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

export function VendorViewModal({ vendor, onClose, onEdit }: Props) {
  const active = vendor.isActive || vendor.status.toLowerCase() === 'active'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Vendor details</h2>
            <p className="text-sm text-slate-500">{vendor.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <Detail label="Vendor name" value={vendor.name} />
          <Detail label="Contact person" value={vendor.contactPerson || '—'} />
          <Detail label="Phone" value={vendor.phone || '—'} />
          <Detail label="Email" value={vendor.email || '—'} />
          <Detail label="Address" value={vendor.address || '—'} />
          <Detail label="Status" value={active ? 'Active' : 'Inactive'} />
          <Detail label="Total purchases" value={formatMoney(vendor.totalPurchases)} />
          <Detail label="Registered" value={formatDate(vendor.createdAt)} />
          {vendor.notes ? (
            <div className="sm:col-span-2">
              <Detail label="Notes" value={vendor.notes} />
            </div>
          ) : null}
        </dl>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(vendor)
            }}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:from-blue-500 hover:to-violet-500"
          >
            Edit vendor
          </button>
        </div>
      </div>
    </div>
  )
}
