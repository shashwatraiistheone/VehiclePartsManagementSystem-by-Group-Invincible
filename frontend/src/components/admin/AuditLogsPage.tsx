import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  ScrollText,
  Activity,
} from 'lucide-react'
import { fetchAuditLogs } from '../../services/auditLogsApi'

type Props = {
  onBack?: () => void
}

export type AuditActionType =
  | 'Payment Received'
  | 'Inventory Updated'
  | 'Review Submitted'
  | 'Purchase Created'
  | 'Invoice Generated'
  | 'Order Completed'
  | 'Loyalty Reward Applied'
  | 'Profile Updated'
  | 'Login'
  | 'Logout'
  | 'Review Moderated'
  | 'Failed Event'

export type AuditLogEntry = {
  id: number
  timestamp: string
  action: AuditActionType
  details: string
  entity: string
  performedBy: string
}

type ActionFilter = 'all' | AuditActionType
type SortOrder = 'newest' | 'oldest'

const PAGE_SIZE = 10

const ACTION_BADGE: Record<AuditActionType, string> = {
  'Payment Received': 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  'Inventory Updated': 'bg-blue-50 text-blue-800 ring-blue-200/80',
  'Review Submitted': 'bg-amber-50 text-amber-900 ring-amber-200/80',
  'Purchase Created': 'bg-violet-50 text-violet-800 ring-violet-200/80',
  'Invoice Generated': 'bg-cyan-50 text-cyan-800 ring-cyan-200/80',
  'Order Completed': 'bg-teal-50 text-teal-800 ring-teal-200/80',
  'Loyalty Reward Applied': 'bg-fuchsia-50 text-fuchsia-800 ring-fuchsia-200/80',
  'Profile Updated': 'bg-slate-100 text-slate-700 ring-slate-200/80',
  Login: 'bg-indigo-50 text-indigo-800 ring-indigo-200/80',
  Logout: 'bg-slate-100 text-slate-600 ring-slate-200/80',
  'Review Moderated': 'bg-amber-50 text-amber-800 ring-amber-200/80',
  'Failed Event': 'bg-rose-50 text-rose-800 ring-rose-200/80',
}

const ALL_ACTIONS: AuditActionType[] = [
  'Payment Received',
  'Inventory Updated',
  'Review Submitted',
  'Purchase Created',
  'Invoice Generated',
  'Order Completed',
  'Loyalty Reward Applied',
  'Profile Updated',
  'Login',
  'Logout',
  'Review Moderated',
  'Failed Event',
]

function buildDemoAuditLogs(): AuditLogEntry[] {
  const templates: Omit<AuditLogEntry, 'id' | 'timestamp'>[] = [
    {
      action: 'Payment Received',
      details:
        'Payment of Rs. 4,531.14 received for invoice INV-20561. New Balance: Rs. 0.00',
      entity: 'Invoice #20561',
      performedBy: 'Customer #1',
    },
    {
      action: 'Inventory Updated',
      details: 'Inventory updated for Engine Oil stock quantity.',
      entity: 'Inventory #3',
      performedBy: 'Staff #3',
    },
    {
      action: 'Review Submitted',
      details: 'Customer submitted a review for brake replacement service.',
      entity: 'Review #5',
      performedBy: 'Customer #12',
    },
    {
      action: 'Purchase Created',
      details: 'Purchase order PO-8842 created for supplier shipment.',
      entity: 'Order #2',
      performedBy: 'Admin #2',
    },
    {
      action: 'Invoice Generated',
      details: 'Invoice INV-20481 generated successfully.',
      entity: 'Invoice #20481',
      performedBy: 'System',
    },
    {
      action: 'Order Completed',
      details: 'Work order WO-1192 marked completed and closed.',
      entity: 'Order #1192',
      performedBy: 'Staff #3',
    },
    {
      action: 'Loyalty Reward Applied',
      details: 'Loyalty discount applied to invoice.',
      entity: 'Invoice #1',
      performedBy: 'System',
    },
    {
      action: 'Profile Updated',
      details: 'Customer contact phone and address updated.',
      entity: 'Customer #12',
      performedBy: 'Customer #12',
    },
    {
      action: 'Review Moderated',
      details: 'Admin approved community review #7 for public display.',
      entity: 'Review #7',
      performedBy: 'Admin #2',
    },
    {
      action: 'Failed Event',
      details: 'Payment gateway timeout during card authorization attempt.',
      entity: 'Invoice #20590',
      performedBy: 'System',
    },
    {
      action: 'Login',
      details: 'Successful staff login from dashboard.',
      entity: 'Session',
      performedBy: 'Staff #3',
    },
    {
      action: 'Logout',
      details: 'User session ended.',
      entity: 'Session',
      performedBy: 'Admin #2',
    },
  ]

  const logs: AuditLogEntry[] = []
  const base = new Date('2026-04-16T20:17:00Z').getTime()

  for (let i = 0; i < 48; i++) {
    const t = templates[i % templates.length]
    const ts = new Date(base - i * 47 * 60 * 1000)
    logs.push({
      id: 48 - i,
      timestamp: ts.toISOString(),
      ...t,
      entity:
        i % 5 === 0
          ? `Invoice #${20480 + i}`
          : i % 4 === 0
            ? `Customer #${1 + (i % 20)}`
            : t.entity,
    })
  }

  return logs
}

const DEMO_LOGS = buildDemoAuditLogs()

function formatAuditTimestamp(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} — ${time}`
}

function ActionBadge({ action }: { action: AuditActionType }) {
  return (
    <span
      className={[
        'inline-flex max-w-[11rem] items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset sm:text-xs sm:normal-case sm:tracking-normal',
        ACTION_BADGE[action],
      ].join(' ')}
    >
      {action}
    </span>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 ring-1 ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

export function AuditLogsPage({ onBack }: Props) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [performerFilter, setPerformerFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [page, setPage] = useState(1)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const rows = await fetchAuditLogs({ limit: 2500 })
      if (rows.length > 0) {
        setLogs(
          rows.map((r) => ({
            id: r.id,
            timestamp: r.timestamp,
            action: r.action as AuditActionType,
            details: r.details,
            entity: r.entity,
            performedBy: r.performedBy,
          })),
        )
      } else {
        setLogs(DEMO_LOGS)
      }
    } catch {
      setLogs(DEMO_LOGS)
    }

    setLastRefreshed(new Date())
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void load()
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [load])

  const entityOptions = useMemo(() => {
    const types = new Set<string>()
    logs.forEach((l) => {
      const prefix = l.entity.split('#')[0]?.trim() ?? l.entity
      if (prefix) types.add(prefix)
    })
    return ['all', ...Array.from(types).sort()]
  }, [logs])

  const performerOptions = useMemo(() => {
    const roles = new Set<string>()
    logs.forEach((l) => {
      const role = l.performedBy.split('#')[0]?.trim() ?? l.performedBy
      if (role) roles.add(role)
    })
    return ['all', ...Array.from(roles).sort()]
  }, [logs])

  const stats = useMemo(() => {
    const payments = logs.filter((l) => l.action === 'Payment Received').length
    const inventory = logs.filter((l) => l.action === 'Inventory Updated').length
    const failed = logs.filter((l) => l.action === 'Failed Event').length
    return { total: logs.length, payments, inventory, failed }
  }, [logs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = [...logs]

    if (actionFilter !== 'all') {
      list = list.filter((l) => l.action === actionFilter)
    }
    if (entityFilter !== 'all') {
      list = list.filter((l) => l.entity.startsWith(entityFilter))
    }
    if (performerFilter !== 'all') {
      list = list.filter((l) => l.performedBy.startsWith(performerFilter))
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime()
      list = list.filter((l) => new Date(l.timestamp).getTime() >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86_400_000
      list = list.filter((l) => new Date(l.timestamp).getTime() < to)
    }
    if (q) {
      list = list.filter(
        (l) =>
          l.details.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.performedBy.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q),
      )
    }

    list.sort((a, b) => {
      const ta = new Date(a.timestamp).getTime()
      const tb = new Date(b.timestamp).getTime()
      return sortOrder === 'newest' ? tb - ta : ta - tb
    })

    return list
  }, [logs, search, actionFilter, entityFilter, performerFilter, dateFrom, dateTo, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [search, actionFilter, entityFilter, performerFilter, dateFrom, dateTo, sortOrder])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function handleExport() {
    const header = ['Timestamp', 'Action', 'Details', 'Entity', 'Performed By']
    const rows = filtered.map((l) => [
      formatAuditTimestamp(l.timestamp),
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
      l.entity,
      l.performedBy,
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const recentCount = filtered.length

  return (
    <div className="min-h-full bg-slate-50/80 pb-12">
      <div className="mx-auto max-w-7xl space-y-6 px-1 sm:px-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        ) : null}

        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">System Audit Logs</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Historical record of critical business and financial events.
          </p>
        </header>

        {/* Dark banner */}
        <section
          className={[
            'flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6 shadow-xl sm:flex-row sm:items-center sm:px-8 sm:py-7',
            'transition-all duration-700',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
          ].join(' ')}
        >
          <div className="flex items-start gap-4">
            <div className="hidden rounded-xl bg-white/10 p-3 sm:block">
              <ScrollText className="h-7 w-7 text-blue-300" />
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Historical record of critical business and financial events
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/50">
            <Activity className="h-4 w-4" />
            {recentCount} Recent Events
          </span>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Events" value={stats.total} tone="bg-white text-slate-900 ring-slate-200" />
          <StatCard
            label="Payments"
            value={stats.payments}
            tone="bg-emerald-50 text-emerald-900 ring-emerald-200"
          />
          <StatCard label="Inventory" value={stats.inventory} tone="bg-blue-50 text-blue-900 ring-blue-200" />
          <StatCard label="Failed" value={stats.failed} tone="bg-rose-50 text-rose-900 ring-rose-200" />
        </section>

        {/* Filters toolbar */}
        <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs…"
                className="w-full rounded-full border border-slate-200 bg-slate-100/80 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void load(true)}
                disabled={loading || refreshing}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={loading || filtered.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export Report
              </button>
              {lastRefreshed ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Live · {lastRefreshed.toLocaleTimeString()}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block text-xs font-semibold text-slate-600">
              From
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              To
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Action
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="all">All actions</option>
                {ALL_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Entity
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {entityOptions.map((o) => (
                  <option key={o} value={o}>
                    {o === 'all' ? 'All entities' : o}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Performed by
              <select
                value={performerFilter}
                onChange={(e) => setPerformerFilter(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                {performerOptions.map((o) => (
                  <option key={o} value={o}>
                    {o === 'all' ? 'All users' : o}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSortOrder('newest')}
              className={[
                'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                sortOrder === 'newest'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              Newest first
              {sortOrder === 'newest' ? <ArrowDown className="h-3 w-3" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('oldest')}
              className={[
                'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                sortOrder === 'oldest'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              Oldest first
              {sortOrder === 'oldest' ? <ArrowUp className="h-3 w-3" /> : null}
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                <tr className="border-b border-slate-200">
                  {['Timestamp', 'Action', 'Details', 'Entity', 'Performed By'].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 sm:px-6"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`sk-${i}`} className="border-b border-slate-100">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="h-4 animate-pulse rounded bg-slate-200" />
                        </td>
                      </tr>
                    ))
                  : pageRows.length === 0
                    ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center text-sm text-slate-500">
                            No audit events match your filters.
                          </td>
                        </tr>
                      )
                    : pageRows.map((row, index) => (
                        <tr
                          key={row.id}
                          className={[
                            'border-b border-slate-100 transition-colors duration-300',
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                            'hover:bg-blue-50/40',
                            mounted ? 'opacity-100' : 'opacity-0',
                          ].join(' ')}
                          style={{ transitionDelay: `${index * 40}ms` }}
                        >
                          <td className="whitespace-nowrap px-4 py-4 text-sm tabular-nums text-slate-600 sm:px-6">
                            {formatAuditTimestamp(row.timestamp)}
                          </td>
                          <td className="px-4 py-4 sm:px-6">
                            <ActionBadge action={row.action} />
                          </td>
                          <td className="max-w-md px-4 py-4 text-sm leading-relaxed text-slate-700 sm:px-6">
                            {row.details}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-slate-800 sm:px-6">
                            {row.entity}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 sm:px-6">
                            {row.performedBy}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 ? (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
                <span className="mx-2 text-slate-300">·</span>
                Showing {pageRows.length} of {filtered.length} events
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={[
                      'flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-semibold transition',
                      page === n
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-600 hover:bg-white',
                    ].join(' ')}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
