import { AlertTriangle, X } from 'lucide-react'
import type { InventoryPart } from '../../services/partsApi'
import { isLowStock } from '../../services/partsApi'
import { formatMoney } from '../../utils/formatUsd'

type Props = {
  parts: InventoryPart[]
  onClose: () => void
}

export function LowStockAlertsModal({ parts, onClose }: Props) {
  const critical = parts.filter((p) => p.isActive && isLowStock(p.quantity)).sort((a, b) => a.quantity - b.quantity)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Low Stock Alerts</h2>
              <p className="text-sm text-slate-600">
                {critical.length} part{critical.length === 1 ? '' : 's'} at or below critical threshold
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/80"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {critical.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">All active parts are above the low stock threshold.</p>
          ) : (
            <ul className="space-y-2">
              {critical.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.partNumber} · {p.category} · {p.vendorName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-red-600">{p.quantity}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
                      {p.quantity <= 0 ? 'Critical' : 'Low'}
                    </p>
                    <p className="text-xs text-slate-500">{formatMoney(p.price)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-slate-100 px-6 py-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  )
}
