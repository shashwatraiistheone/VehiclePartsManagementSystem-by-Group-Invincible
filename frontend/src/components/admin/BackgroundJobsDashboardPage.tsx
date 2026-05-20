import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchBackgroundJobsDashboard } from '../../services/backgroundJobsApi'

type Props = {
  onBack?: () => void
}

type JobStatus = 'running' | 'idle' | 'failed' | 'scheduled'

type BackgroundJob = {
  id: string
  name: string
  queue: string
  status: JobStatus
  lastRun: string
  nextRun?: string
}

type ActivityEvent = {
  id: number
  message: string
  time: string
  type: 'success' | 'info' | 'error'
}

const NAV_STATS = { jobs: 7, queues: 3, recurring: 5, servers: 2 } as const

const BACKGROUND_JOBS: BackgroundJob[] = [
  {
    id: 'inv-gen',
    name: 'Automated Invoice Generation',
    queue: 'billing',
    status: 'running',
    lastRun: new Date(Date.now() - 120_000).toISOString(),
    nextRun: new Date(Date.now() + 3_600_000).toISOString(),
  },
  {
    id: 'sales-rpt',
    name: 'Daily Sales Report Generation',
    queue: 'reports',
    status: 'scheduled',
    lastRun: new Date(Date.now() - 86_400_000).toISOString(),
    nextRun: new Date(Date.now() + 43_200_000).toISOString(),
  },
  {
    id: 'inv-sync',
    name: 'Inventory Synchronization',
    queue: 'inventory',
    status: 'running',
    lastRun: new Date(Date.now() - 45_000).toISOString(),
  },
  {
    id: 'loyalty',
    name: 'Loyalty Reward Processing',
    queue: 'loyalty',
    status: 'idle',
    lastRun: new Date(Date.now() - 1_800_000).toISOString(),
    nextRun: new Date(Date.now() + 7_200_000).toISOString(),
  },
  {
    id: 'audit-clean',
    name: 'Audit Log Cleanup',
    queue: 'maintenance',
    status: 'scheduled',
    lastRun: new Date(Date.now() - 172_800_000).toISOString(),
    nextRun: new Date(Date.now() + 259_200_000).toISOString(),
  },
  {
    id: 'email',
    name: 'Email Notification Jobs',
    queue: 'notifications',
    status: 'running',
    lastRun: new Date(Date.now() - 15_000).toISOString(),
  },
  {
    id: 'backup',
    name: 'Scheduled Database Backup',
    queue: 'maintenance',
    status: 'idle',
    lastRun: new Date(Date.now() - 432_000_000).toISOString(),
    nextRun: new Date(Date.now() + 432_000_000).toISOString(),
  },
]

const QUEUES = [
  { name: 'billing', pending: 2, processing: 1, workers: 2 },
  { name: 'inventory', pending: 5, processing: 2, workers: 3 },
  { name: 'notifications', pending: 12, processing: 4, workers: 2 },
]

function randomBetween(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1))
}

function buildHistorySeries() {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = `${String(i).padStart(2, '0')}:00`
    const base = 8 + Math.sin(i / 3) * 6
    return {
      time: hour,
      completed: Math.round(base + randomBetween(0, 12)),
      failed: randomBetween(0, 3),
    }
  })
}

function buildRealtimePoint(tick: number) {
  return {
    time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    active: randomBetween(4, 18),
    queued: randomBetween(2, 14),
    tick,
  }
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-600/80 bg-slate-900/95 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-slate-300">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

function NavStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/60 px-4 py-2.5 shadow-inner">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      <span className="rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/30">
        {value}
      </span>
    </div>
  )
}

function StatusDot({ status }: { status: JobStatus }) {
  const colors = {
    running: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse',
    idle: 'bg-slate-500',
    failed: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    scheduled: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',
  }
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status]}`} />
}

export function BackgroundJobsDashboardPage({ onBack }: Props) {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [tick, setTick] = useState(0)
  const [jobs, setJobs] = useState(BACKGROUND_JOBS)
  const [historyData, setHistoryData] = useState(buildHistorySeries)
  const [successRate, setSuccessRate] = useState(96)
  const [realtimeSeries, setRealtimeSeries] = useState(() =>
    Array.from({ length: 20 }, (_, i) => buildRealtimePoint(i)),
  )
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([
    { id: 1, message: 'Invoice batch INV-20600 queued on billing worker', time: new Date().toISOString(), type: 'info' },
    { id: 2, message: 'Inventory sync completed — 142 SKUs updated', time: new Date(Date.now() - 30_000).toISOString(), type: 'success' },
    { id: 3, message: 'Email notification job dispatched to 8 customers', time: new Date(Date.now() - 90_000).toISOString(), type: 'info' },
  ])
  const [runningCount, setRunningCount] = useState(3)
  const [failedCount, setFailedCount] = useState(1)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const pulse = useCallback(() => {
    setTick((t) => t + 1)
    setRealtimeSeries((prev) => {
      const next = [...prev.slice(-19), buildRealtimePoint(tick)]
      return next
    })
    setRunningCount(randomBetween(2, 5))
    setFailedCount(randomBetween(0, 2))
    setLastRefresh(new Date())

    const messages = [
      'Queue processor handled 6 tasks on inventory queue',
      'Daily sales report generation started',
      'Loyalty reward batch processed successfully',
      'Database backup worker idle — next run scheduled',
      'Audit log cleanup removed 1,204 stale entries',
      'Payment reminder emails sent to 3 customers',
    ]
    setActivityFeed((prev) => [
      {
        id: Date.now(),
        message: messages[randomBetween(0, messages.length - 1)],
        time: new Date().toISOString(),
        type: randomBetween(0, 10) > 8 ? 'error' : randomBetween(0, 10) > 6 ? 'success' : 'info',
      },
      ...prev.slice(0, 11),
    ])
  }, [tick])

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const dash = await fetchBackgroundJobsDashboard()
        if (dash.jobs.length > 0) {
          setJobs(
            dash.jobs.map((j) => ({
              id: j.id,
              name: j.name,
              queue: j.queue,
              status: (j.status === 'failed' ? 'failed' : j.status === 'running' ? 'running' : 'idle') as JobStatus,
              lastRun: j.lastRun,
              nextRun: j.nextRun,
            })),
          )
        }
        if (dash.history.length > 0) {
          setHistoryData(
            dash.history.map((h) => ({
              time: h.time,
              completed: h.completed,
              failed: h.failed,
            })),
          )
        }
        if (dash.successRate > 0) setSuccessRate(Math.round(dash.successRate))
        setFailedCount(dash.failedRuns > 0 ? Math.min(3, dash.failedRuns) : 0)
      } catch {
        /* keep static demo */
      }
    })()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const id = window.setInterval(() => pulse(), 4000)
    return () => window.clearInterval(id)
  }, [autoRefresh, pulse])

  const healthScore = useMemo(() => {
    const base = 96 - failedCount * 4 - (failedCount > 0 ? 2 : 0)
    return Math.max(72, Math.min(99, base))
  }, [failedCount])

  async function handleManualRefresh() {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 500))
    pulse()
    setRefreshing(false)
  }

  return (
    <div className="min-h-full bg-[#0b0f14] pb-12 text-slate-200">
      <div className="mx-auto max-w-7xl space-y-6 px-2 sm:px-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 transition hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        ) : null}

        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Background Jobs Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Monitor recurring tasks, automated jobs, and system background processes in real time.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoRefresh((a) => !a)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                autoRefresh
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-600 bg-slate-800 text-slate-400',
              ].join(' ')}
            >
              {autoRefresh ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              Auto-refresh {autoRefresh ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              onClick={() => void handleManualRefresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </header>

        {/* Dark nav stats */}
        <nav
          className={[
            'flex flex-wrap gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4 shadow-lg shadow-black/20 backdrop-blur-sm',
            'transition-all duration-700',
            mounted ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <NavStat label="Jobs" value={NAV_STATS.jobs} />
          <NavStat label="Queues" value={NAV_STATS.queues} />
          <NavStat label="Recurring Jobs" value={NAV_STATS.recurring} />
          <NavStat label="Servers" value={NAV_STATS.servers} />
        </nav>

        {/* Status row */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Running</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-400">
              <Activity className="h-5 w-5" />
              {runningCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Failed</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-rose-400">
              {failedCount > 0 ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {failedCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Server Uptime</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-cyan-400">
              <Server className="h-5 w-5" />
              99.8%
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80">System Health</p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{healthScore}%</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>
        </section>

        {/* Overview graphs */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Overview</h2>

          <article className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Zap className="h-4 w-4 text-amber-400" />
                Realtime Graph
              </h3>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className="relative flex h-2 w-2">
                  {autoRefresh ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  ) : null}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live · {lastRefresh.toLocaleTimeString()}
              </span>
            </div>
            <div className="h-64 w-full p-4 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeSeries} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#334155" vertical={false} opacity={0.6} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<DarkTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="active"
                    name="Active Jobs"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                  />
                  <Line
                    type="monotone"
                    dataKey="queued"
                    name="Queued"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-xl shadow-black/30">
            <div className="border-b border-slate-700/60 px-5 py-4">
              <h3 className="font-semibold text-white">History Graph</h3>
              <p className="mt-0.5 text-xs text-slate-500">24-hour completed task activity</p>
            </div>
            <div className="h-64 w-full p-4 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#334155" vertical={false} opacity={0.6} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#historyGrad)"
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Jobs list */}
          <section className="lg:col-span-2 space-y-3">
            <h2 className="text-lg font-bold text-white">Background Workers</h2>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 transition hover:border-slate-600 hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <StatusDot status={job.status} />
                    <div>
                      <p className="font-semibold text-slate-100">{job.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Queue: <span className="text-slate-400">{job.queue}</span>
                        · Last run {formatRelative(job.lastRun)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      'inline-flex self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:self-center',
                      job.status === 'running'
                        ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                        : job.status === 'failed'
                          ? 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30'
                          : job.status === 'scheduled'
                            ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                            : 'bg-slate-700/50 text-slate-400 ring-1 ring-slate-600',
                    ].join(' ')}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Sidebar: queues + activity */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Queue Status</h2>
              <ul className="space-y-3">
                {QUEUES.map((q) => (
                  <li key={q.name} className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
                    <p className="font-semibold capitalize text-slate-200">{q.name}</p>
                    <div className="mt-2 flex gap-3 text-xs text-slate-500">
                      <span>Pending: {q.pending}</span>
                      <span>Processing: {q.processing}</span>
                      <span>Workers: {q.workers}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                <Clock className="h-4 w-4" />
                Live Activity
              </h2>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {activityFeed.map((ev) => (
                  <li
                    key={ev.id}
                    className={[
                      'rounded-lg border px-3 py-2 text-xs',
                      ev.type === 'error'
                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                        : ev.type === 'success'
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-slate-300'
                          : 'border-slate-700/50 bg-slate-800/40 text-slate-400',
                    ].join(' ')}
                  >
                    <p>{ev.message}</p>
                    <p className="mt-1 text-[10px] opacity-70">{formatRelative(ev.time)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {refreshing ? (
          <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-slate-300 shadow-xl">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            Syncing…
          </div>
        ) : null}
      </div>
    </div>
  )
}
