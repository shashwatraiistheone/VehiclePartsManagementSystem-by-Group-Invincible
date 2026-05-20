import { useEffect, useState } from 'react'
import { Package, Users, Receipt, TrendingUp, RefreshCw } from 'lucide-react'
import { fetchDashboardReport } from '../../services/reportApi'

type Props = {
  onNavigate: (page: 'inventory' | 'customers' | 'sales-history') => void
}

export function AdminStaffDashboardPage({ onNavigate }: Props) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    weeklyPurchaseItems: 0,
    weeklyInteractions: 0,
    openInvoices: 0,
  })

  async function loadStats() {
    setLoading(true)
    try {
      const report = await fetchDashboardReport()
      setStats({
        weeklyPurchaseItems: report.weeklyPurchaseItemsCount ?? 0,
        weeklyInteractions: report.weeklyCustomerInteractions ?? 0,
        openInvoices: report.pendingCreditsCount ?? 0,
      })
    } catch {
      setStats({ weeklyPurchaseItems: 0, weeklyInteractions: 0, openInvoices: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStats()
  }, [])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Staff Dashboard</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Operations-focused view: jump to inventory, customers, or sales without leaving the admin shell.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStats()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Parts restocked',
            value: String(stats.weeklyPurchaseItems),
            sub: 'This week',
            Icon: Package,
            accent: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'Customer touches',
            value: String(stats.weeklyInteractions),
            sub: 'Sales + appointments',
            Icon: Users,
            accent: 'from-blue-500 to-indigo-600',
          },
          {
            label: 'Open invoices',
            value: String(stats.openInvoices),
            sub: 'Awaiting payment',
            Icon: Receipt,
            accent: 'from-amber-500 to-orange-600',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className={`inline-flex rounded-xl bg-gradient-to-br p-2.5 text-white shadow-md ${c.accent}`}>
              <c.Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-2xl font-bold text-slate-900">{loading ? '…' : c.value}</p>
            <p className="text-sm font-semibold text-slate-800">{c.label}</p>
            <p className="text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <TrendingUp className="h-4 w-4" />
          Shortcuts
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="group rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <Package className="h-6 w-6 text-blue-600 transition group-hover:scale-105" />
            <p className="mt-3 font-semibold text-slate-900">Inventory</p>
            <p className="text-xs text-slate-500">Stock levels and catalogue</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('customers')}
            className="group rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <Users className="h-6 w-6 text-blue-600 transition group-hover:scale-105" />
            <p className="mt-3 font-semibold text-slate-900">Customers</p>
            <p className="text-xs text-slate-500">Profiles and history</p>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('sales-history')}
            className="group rounded-2xl border border-slate-200/90 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <Receipt className="h-6 w-6 text-blue-600 transition group-hover:scale-105" />
            <p className="mt-3 font-semibold text-slate-900">Sales</p>
            <p className="text-xs text-slate-500">History and invoices</p>
          </button>
        </div>
      </section>
    </div>
  )
}
