import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import {
  fetchInventoryNotifications,
  formatNotificationTime,
  severityStyles,
  type InventoryNotification,
} from '../../services/inventoryNotificationsApi'

type Props = {
  open: boolean
  onClose: () => void
  onViewAll: () => void
  onCheckInventory: (partId: number) => void
}

export function LowStockAlertsDropdown({ open, onClose, onViewAll, onCheckInventory }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<InventoryNotification[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const rows = await fetchInventoryNotifications(5)
      const unread = rows.filter((n) => !n.isRead)
      setItems((unread.length ? unread : rows).slice(0, 5))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] origin-top-right animate-[dropdownIn_0.2s_ease-out] rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">Low Stock Alerts</p>
        <p className="text-xs text-slate-500">Latest inventory warnings</p>
      </div>
      <div className="max-h-72 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">No low stock alerts right now.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((n) => {
              const styles = severityStyles(n.severity, n.isRead)
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onCheckInventory(n.partId)}
                    className={[
                      'w-full rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-slate-50 hover:shadow-sm',
                      !n.isRead ? 'bg-slate-50/80' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-semibold ${styles.accent}`}>{n.partName}</p>
                        <p className="text-xs text-slate-600">
                          Stock: <span className="font-semibold tabular-nums">{n.stockQuantity}</span>
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{formatNotificationTime(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-800"
        >
          View All
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}



