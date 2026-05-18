import { useEffect, useState } from 'react'
import { AlertTriangle, Check, Eye, RefreshCw, Search, Bell, Inbox, AlertCircle } from 'lucide-react'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getToken, type Notification } from '../../api'

export function SystemAlerts() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'stock' | 'credit'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getToken()
      if (!token) return
      const data = await getNotifications(token)
      setNotifications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleMarkAsRead = async (id: number) => {
    try {
      const token = getToken()
      if (!token) return
      await markNotificationAsRead(token, id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const token = getToken()
      if (!token) return
      await markAllNotificationsAsRead(token)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Action failed')
    }
  }

  // Active unread count
  const activeAlerts = notifications.filter((n) => !n.isRead)
  const stockAlertsCount = activeAlerts.filter((n) => n.type === 'LowStock').length
  const creditAlertsCount = activeAlerts.filter((n) => n.type === 'UnpaidCredit').length

  const filtered = notifications
    .filter((n) => {
      if (filter === 'stock') return n.type === 'LowStock'
      if (filter === 'credit') return n.type === 'UnpaidCredit'
      return true
    })
    .filter((n) => {
      const term = searchTerm.toLowerCase()
      return n.title.toLowerCase().includes(term) || n.message.toLowerCase().includes(term)
    })

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md transition hover:shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative rounded-xl bg-amber-50 p-2.5 text-amber-500">
            <Bell className="h-5 w-5" />
            {activeAlerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {activeAlerts.length}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">System Alerts & Notifications</h2>
            <p className="text-xs text-slate-500">Real-time inventory levels and credit monitors</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeAlerts.length > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Check className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={fetchAlerts}
            title="Refresh"
            disabled={loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex rounded-lg bg-slate-100 p-0.5 ring-1 ring-slate-200/50">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('stock')}
            className={`relative rounded-md px-3 py-1 text-xs font-medium transition ${
              filter === 'stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Low Stock
            {stockAlertsCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-red-800">
                {stockAlertsCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter('credit')}
            className={`relative rounded-md px-3 py-1 text-xs font-medium transition ${
              filter === 'credit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Overdue Credit
            {creditAlertsCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-red-800">
                {creditAlertsCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="mt-4 max-h-[350px] overflow-y-auto pr-1 space-y-3">
        {loading ? (
          // Shimmer loading state
          <div className="space-y-3 py-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 animate-pulse">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-3 w-1/3 rounded bg-slate-200" />
                  <div className="h-2 w-3/4 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 animate-bounce" />
            <p className="mt-3 text-sm font-semibold text-slate-800">Error loading alerts</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={fetchAlerts}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/40">
            <Inbox className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">All Systems Nominal</p>
            <p className="mt-1 text-xs text-slate-400">No active stock or overdue credit warnings.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isUnread = !item.isRead
            const isStock = item.type === 'LowStock'

            return (
              <div
                key={item.id}
                className={`flex gap-4 rounded-xl border p-4 transition-all duration-200 ${
                  isUnread
                    ? isStock
                      ? 'border-red-100 bg-red-50/40 shadow-sm'
                      : 'border-amber-100 bg-amber-50/30 shadow-sm'
                    : 'border-slate-100 bg-white opacity-70'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isStock
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800">
                        {item.title}
                        {isUnread && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-800">
                            New
                          </span>
                        )}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.message}</p>
                    </div>

                    <span className="shrink-0 text-[10px] font-medium text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isUnread && (
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100/50 pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
