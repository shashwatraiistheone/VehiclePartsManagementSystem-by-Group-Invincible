import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Wallet,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AdminPageId } from '../../../admin/adminPages'
import { getAccountEmailFromToken } from '../../../lib/auth'
import { getToken, getParts, getNotifications, getInvoices, getDashboardReport, type Part, type Notification } from '../../../api'
import { fetchDashboardAnalytics } from '../../../services/reportApi'
import { fetchAppointments } from '../../../services/appointmentApi'
import { SimpleBarChart, SimpleLineChart } from './SimpleChart'
import { QuickAccessSection } from './QuickAccessSection'
import { formatRs } from '../../../utils/formatUsd'

type Props = {
  onNavigate: (id: AdminPageId) => void
}

function StatCard(props: {
  label: string
  value: string
  trend: number
  Icon: LucideIcon
  iconBg: string
  iconColor: string
}) {
  const up = props.trend >= 0
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200/60 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${props.iconBg} ${props.iconColor} transition group-hover:scale-105`}>
          <props.Icon className="h-5 w-5" aria-hidden />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
            up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(props.trend)}%
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{props.value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{props.label}</p>
    </div>
  )
}

function Panel(props: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{props.title}</h2>
          {props.subtitle ? <p className="mt-0.5 text-xs text-slate-500">{props.subtitle}</p> : null}
        </div>
        {props.action}
      </div>
      {props.children}
    </section>
  )
}

export function AdminInsightsDashboard({ onNavigate }: Props) {
  const [now, setNow] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState({ totalCustomers: 0, totalSales: 0, totalRevenue: 0, lowStockPartsCount: 0 })
  const [lowStock, setLowStock] = useState<{ name: string; qty: number }[]>([])
  const [activities, setActivities] = useState<{ title: string; detail: string; time: string; type: string }[]>([])
  const [chartLabels, setChartLabels] = useState<string[]>([])
  const [chartRevenue, setChartRevenue] = useState<number[]>([])
  const [chartSales, setChartSales] = useState<number[]>([])
  const [chartInventory, setChartInventory] = useState<number[]>([])
  const [pendingCredits, setPendingCredits] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [trends, setTrends] = useState({
    revenue: 0,
    customers: 0,
    sales: 0,
    lowStock: 0,
    pendingCredits: 0,
  })

  const accountLabel = useMemo(() => {
    const email = getAccountEmailFromToken()
    if (!email) return 'Admin'
    const local = email.split('@')[0]
    return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Admin'
  }, [])

  const profit = report.totalRevenue - expenses

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const [rep, parts, notes, invoices, analytics, appointments] = await Promise.all([
        getDashboardReport(token).catch(() => null),
        getParts(token).catch(() => [] as Part[]),
        getNotifications(token).catch(() => [] as Notification[]),
        getInvoices(token).catch(() => []),
        fetchDashboardAnalytics().catch(() => null),
        fetchAppointments().then((r) => r.items).catch(() => []),
      ])

      if (rep) {
        setReport(rep)
        setPendingCredits(rep.pendingCreditsCount ?? analytics?.pendingCreditsCount ?? 0)
        setExpenses(rep.monthlyPurchaseCost ?? 0)
      }

      if (analytics) {
        setChartLabels(analytics.labels)
        setChartRevenue(analytics.monthlyRevenue)
        setChartSales(analytics.monthlySalesCount)
        setChartInventory(analytics.monthlyUnitsSold)
        setPendingCredits(analytics.pendingCreditsCount)
        setTrends({
          revenue: analytics.revenueTrendPercent ?? 0,
          customers: analytics.customersTrendPercent ?? 0,
          sales: analytics.salesTrendPercent ?? 0,
          lowStock: analytics.lowStockTrendPercent ?? 0,
          pendingCredits: analytics.pendingCreditsTrendPercent ?? 0,
        })
      }

      const fromParts = (Array.isArray(parts) ? parts : [])
        .filter((p) => p.quantity < 10)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5)
        .map((p) => ({ name: p.name, qty: p.quantity }))

      setLowStock(fromParts.slice(0, 5))

      const feed: { title: string; detail: string; time: string; type: string }[] = []

      if (Array.isArray(notes)) {
        notes.slice(0, 4).forEach((n) => {
          feed.push({
            title: n.title,
            detail: n.message,
            time: new Date(n.createdAt).toLocaleString(),
            type: n.type === 'LowStock' ? 'stock' : 'credit',
          })
        })
      }

      if (Array.isArray(invoices)) {
        invoices.slice(0, 4).forEach((inv) => {
          feed.push({
            title: inv.isPaid ? 'Invoice paid' : 'Outstanding invoice',
            detail: `${inv.invoiceNumber} · ${formatRs(inv.sale?.totalAmount ?? 0)}`,
            time: new Date(inv.createdDate).toLocaleString(),
            type: 'invoice',
          })
        })
      }

      appointments.slice(0, 3).forEach((a) => {
        feed.push({
          title: 'Appointment booked',
          detail: `${a.customerName} · ${a.serviceType}`,
          time: new Date(a.date).toLocaleString(),
          type: 'appointment',
        })
      })

      setActivities(
        feed
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 8),
      )
    } finally {
      setLoading(false)
    }
  }

  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="w-full min-w-0 space-y-6 pb-4">
      {/* Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {accountLabel} 👋
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {dateStr} · {timeStr}
            </span>
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Business intelligence overview — sales performance, inventory health, and customer activity at a glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh data
        </button>
      </header>

      <QuickAccessSection onNavigate={onNavigate} />

      {/* KPI analytics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Revenue" value={formatRs(report.totalRevenue)} trend={trends.revenue} Icon={DollarSign} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Customers" value={String(report.totalCustomers)} trend={trends.customers} Icon={Users} iconBg="bg-cyan-50" iconColor="text-cyan-600" />
        <StatCard label="Sales" value={String(report.totalSales)} trend={trends.sales} Icon={ShoppingCart} iconBg="bg-violet-50" iconColor="text-violet-600" />
        <StatCard label="Low Stock" value={String(report.lowStockPartsCount || lowStock.length)} trend={trends.lowStock} Icon={Package} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard label="Pending Credits" value={String(pendingCredits)} trend={trends.pendingCredits} Icon={Wallet} iconBg="bg-orange-50" iconColor="text-orange-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Revenue Chart" subtitle="Trailing 12 months">
          <SimpleBarChart labels={chartLabels.length ? chartLabels : ['—']} values={chartRevenue} color="#2563eb" height={180} />
        </Panel>
        <Panel title="Sales Trends" subtitle="Units sold per month">
          <SimpleLineChart labels={chartLabels.length ? chartLabels : ['—']} values={chartSales} color="#7c3aed" height={180} />
        </Panel>
        <Panel title="Inventory Trends" subtitle="Stock movement index">
          <SimpleLineChart labels={chartLabels.length ? chartLabels : ['—']} values={chartInventory} color="#0891b2" height={180} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Low stock */}
        <div className="lg:col-span-5">
          <Panel
            title="Low Stock Alerts"
            subtitle="Items below reorder threshold"
            action={
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View inventory
              </button>
            }
          >
            <ul className="space-y-3">
              {lowStock.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/40 p-4 transition hover:shadow-md"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">{item.name}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.qty <= 2
                              ? 'bg-red-100 text-red-700'
                              : item.qty <= 5
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.qty <= 2 ? 'Critical' : 'Low stock'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-amber-800">
                        <span className="font-bold">{item.qty}</span> left in stock
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('inventory')}
                    className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
                  >
                    Reorder
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-7">
          <Panel title="Recent Activities" subtitle="Latest system events">
            <ol className="relative space-y-0 border-l-2 border-slate-100 pl-6">
              {activities.map((a, i) => (
                <li key={`${a.title}-${i}`} className="relative pb-6 last:pb-0">
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 ring-4 ring-blue-50" />
                  <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{a.detail}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{a.time}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <Panel title="Financial Summary" subtitle="Current period overview">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Revenue', value: formatRs(report.totalRevenue), color: 'text-blue-600' },
            { label: 'Expenses', value: formatRs(expenses), color: 'text-slate-700' },
            { label: 'Profit', value: formatRs(profit), color: 'text-emerald-600' },
            { label: 'Pending Credits', value: String(pendingCredits), color: 'text-amber-600' },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition hover:bg-white hover:shadow-sm"
            >
              <dt className="text-sm font-medium text-slate-600">{row.label}</dt>
              <dd className={`text-sm font-bold ${row.color}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  )
}
