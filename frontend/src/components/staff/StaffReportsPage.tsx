import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Banknote,
  CalendarRange,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Star,
  Users,
} from 'lucide-react'
import {
  fetchCustomerReportsDashboard,
  type CustomerReportsDashboard,
  type ReportDateParams,
} from '../../services/customerReportsApi'
import {
  StaffCustomerReportDetailModal,
  type ReportKind,
} from './reports/StaffCustomerReportDetailModal'
import {
  staffPendingCreditReportPath,
  staffRegularCustomersReportPath,
  staffTopSpendersReportPath,
} from '../../staff/staffRoutes'
import { formatRs } from '../../utils/formatUsd'

function formatCount(n: number) {
  return n.toLocaleString('en-US')
}

type ReportCardConfig = {
  kind: ReportKind
  title: string
  description: string
  Icon: typeof Star
  iconWrap: string
  iconColor: string
}

const REPORT_CARDS: ReportCardConfig[] = [
  {
    kind: 'top-spenders',
    title: 'Top Spenders',
    description: 'Identify customers with the highest lifetime purchase value.',
    Icon: Star,
    iconWrap: 'bg-amber-50 ring-amber-100',
    iconColor: 'text-amber-500',
  },
  {
    kind: 'regular-customers',
    title: 'Regular Customers',
    description: 'Analyze purchase frequency and high-engagement customers.',
    Icon: ClipboardList,
    iconWrap: 'bg-blue-50 ring-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    kind: 'pending-credits',
    title: 'Pending Credits',
    description: 'Monitor unpaid credit invoices and overdue accounts.',
    Icon: AlertTriangle,
    iconWrap: 'bg-rose-50 ring-rose-100',
    iconColor: 'text-rose-500',
  },
]

export function StaffReportsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const inStaffWorkspace = location.pathname.startsWith('/staff')
  const [dashboard, setDashboard] = useState<CustomerReportsDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [activeReport, setActiveReport] = useState<ReportKind | null>(null)

  const dateParams: ReportDateParams = {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCustomerReportsDashboard(dateParams)
      setDashboard(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [from, to, search])

  useEffect(() => {
    void load()
  }, [load])

  function handleExportDashboardCsv() {
    if (!dashboard) return
    const rows = [
      ['Metric', 'Value'],
      ['Total Customers', dashboard.totalCustomers],
      ['Total Revenue', dashboard.totalRevenue.toFixed(2)],
      ['Pending Credit', dashboard.pendingCredit.toFixed(2)],
      ['Total Sales', dashboard.totalSales],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customer-reports-dashboard.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="animate-in fade-in space-y-8 duration-300">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Reports Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Customer analytics, revenue insights, spending trends, loyalty data, and pending credits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:flex-wrap">
        <label className="block min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            From
          </span>
          <div className="relative mt-1">
            <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </label>
        <label className="block min-w-[140px] flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">To</span>
          <div className="relative mt-1">
            <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </label>
        <label className="block min-w-[200px] flex-[2]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Search customers
          </span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, invoice…"
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-3 pl-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </label>
        <div className="flex flex-wrap gap-2 pb-0.5">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleExportDashboardCsv}
            disabled={!dashboard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading && !dashboard ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading analytics…</p>
        </div>
      ) : dashboard ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Customers"
              value={formatCount(dashboard.totalCustomers)}
              gradient="from-blue-600 via-blue-600 to-indigo-600"
              textLight
              Icon={Users}
              iconBg="bg-white/15"
              loading={loading}
            />
            <StatCard
              label="Total Revenue"
              value={formatRs(dashboard.totalRevenue)}
              pastel="bg-emerald-50/90 ring-emerald-100"
              valueColor="text-emerald-800"
              Icon={Banknote}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              loading={loading}
            />
            <StatCard
              label="Pending Credit"
              value={formatRs(dashboard.pendingCredit)}
              pastel="bg-rose-50/90 ring-rose-100"
              valueColor="text-rose-800"
              Icon={AlertTriangle}
              iconBg="bg-rose-100"
              iconColor="text-rose-600"
              loading={loading}
            />
            <StatCard
              label="Total Sales"
              value={formatCount(dashboard.totalSales)}
              pastel="bg-sky-50/90 ring-sky-100"
              valueColor="text-sky-900"
              Icon={ShoppingBag}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
              loading={loading}
            />
          </section>

          <section>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
              Customer insight reports
            </h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {REPORT_CARDS.map((card) => (
                <ReportCard
                  key={card.kind}
                  {...card}
                  onView={() => {
                    if (inStaffWorkspace) {
                      if (card.kind === 'top-spenders') {
                        navigate(staffTopSpendersReportPath())
                      } else if (card.kind === 'regular-customers') {
                        navigate(staffRegularCustomersReportPath())
                      } else {
                        navigate(staffPendingCreditReportPath())
                      }
                    } else {
                      setActiveReport(card.kind)
                    }
                  }}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {activeReport ? (
        <StaffCustomerReportDetailModal
          kind={activeReport}
          dateParams={dateParams}
          search={search}
          onClose={() => setActiveReport(null)}
        />
      ) : null}
    </div>
  )
}

function StatCard({
  label,
  value,
  Icon,
  iconBg,
  iconColor = 'text-white',
  gradient,
  pastel,
  valueColor = 'text-white',
  textLight,
  loading,
}: {
  label: string
  value: string
  Icon: typeof Users
  iconBg: string
  iconColor?: string
  gradient?: string
  pastel?: string
  valueColor?: string
  textLight?: boolean
  loading?: boolean
}) {
  const isGradient = Boolean(gradient)
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl p-5 shadow-md ring-1 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        isGradient
          ? `bg-gradient-to-br ${gradient} ring-blue-500/20 text-white`
          : `${pastel ?? 'bg-white ring-slate-200'}`
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-[10px] font-bold uppercase tracking-widest ${
              textLight ? 'text-blue-100' : 'text-slate-500'
            }`}
          >
            {label}
          </p>
          {loading ? (
            <Loader2 className={`mt-2 h-7 w-7 animate-spin ${textLight ? 'text-white/80' : 'text-slate-400'}`} />
          ) : (
            <p className={`mt-2 text-3xl font-extrabold tabular-nums tracking-tight ${valueColor}`}>
              {value}
            </p>
          )}
        </div>
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition group-hover:scale-105 ${iconBg} ${
            isGradient ? 'ring-white/20' : ''
          }`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden />
        </span>
      </div>
    </div>
  )
}

function ReportCard({
  title,
  description,
  Icon,
  iconWrap,
  iconColor,
  onView,
}: ReportCardConfig & { onView: () => void }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full ring-1 transition group-hover:scale-105">
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ring-1 ${iconWrap}`}>
          <Icon className={`h-7 w-7 ${iconColor}`} aria-hidden />
        </span>
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onView}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700"
      >
        View Report
      </button>
    </article>
  )
}
