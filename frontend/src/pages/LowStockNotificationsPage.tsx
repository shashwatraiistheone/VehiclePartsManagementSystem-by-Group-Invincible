import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, Bell, Loader2 } from 'lucide-react'
import type { AdminPageId } from '../admin/adminPages'
import {
  fetchInventoryNotifications,
  formatNotificationTime,
  markNotificationRead,
  severityStyles,
  type InventoryNotification,
} from '../services/inventoryNotificationsApi'

type Props = {
  onBack: () => void
  onNavigate: (page: AdminPageId, options?: AdminNavigateOptions) => void
}

export default function LowStockNotificationsPage({ onBack, onNavigate }: Props) {
  const [items, setItems] = useState<InventoryNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [readLocal, setReadLocal] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchInventoryNotifications())
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleMarkRead(n: InventoryNotification) {
    setReadLocal((prev) => new Set(prev).add(n.id))
    try {
      await markNotificationRead(n.id)
    } catch {
      /* local fade still applies */
    }
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
  }

  function isRead(n: InventoryNotification) {
    return n.isRead || readLocal.has(n.id)
  }

  const unreadCount = items.filter((n) => !isRead(n)).length

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inventory
      </button>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Inventory Notifications</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Monitor critical stock levels across all inventory parts.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-20 text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading notifications…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Bell className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">No inventory alerts</p>
          <p className="mt-1 text-sm text-slate-500">Stock levels are healthy across all parts.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const read = isRead(n)
            const styles = severityStyles(n.severity, read)
            return (
              <li
                key={n.id}
                className={[
                  'flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 sm:flex-row sm:items-start sm:justify-between sm:p-5',
                  'hover:shadow-md',
                  styles.card,
                  styles.glow,
                  read ? 'opacity-60' : '',
                ].join(' ')}
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">Low Stock Alert</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{n.message}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <button
                        type="button"
                        onClick={() => void handleMarkRead(n)}
                        disabled={read}
                        className="font-semibold text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline disabled:cursor-default disabled:no-underline disabled:opacity-50"
                      >
                        Mark as Read
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('inventory', {
                            highlightPartId: n.partId,
                            focusPartOnly: true,
                          })
                        }
                        className={`font-semibold underline-offset-2 transition hover:underline ${styles.accent}`}
                      >
                        Check Inventory
                      </button>
                    </div>
                  </div>
                </div>
                <p className="shrink-0 text-xs font-medium text-slate-500 sm:text-right">
                  {formatNotificationTime(n.createdAt)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
