import { CubeIcon, UserGroupIcon, CurrencyDollarIcon, SignalIcon } from '@heroicons/react/24/outline'
import { ADMIN_SCENARIO_FEATURES } from '../../features/adminScenarioFeatures'
import { ScenarioFeatureCard } from './ScenarioFeatureCard'
import { StatCard } from '../ui/StatCard'
import type { TabId } from '../layout/Sidebar'

type Props = {
  onNavigate: (tab: TabId) => void
}

const overview = {
  totalParts: 128,
  totalCustomers: 45,
  totalSalesRs: 482_500,
  systemStatus: 'Active',
}

function formatLkr(n: number) {
  return `Rs ${n.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`
}

export function AdminScenarioDashboard({ onNavigate }: Props) {
  return (
    <div className="min-h-0 space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Manage system operations, inventory, and performance.
        </p>
      </header>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">System features</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-800 ring-1 ring-rose-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Pending
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {ADMIN_SCENARIO_FEATURES.map((f) => (
            <ScenarioFeatureCard key={f.id} feature={f} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Quick overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total parts"
            value={String(overview.totalParts)}
            sub="In catalogue"
            Icon={CubeIcon}
          />
          <StatCard
            label="Total customers"
            value={String(overview.totalCustomers)}
            sub="Registered"
            Icon={UserGroupIcon}
            accent="emerald"
          />
          <StatCard
            label="Total sales"
            value={formatLkr(overview.totalSalesRs)}
            sub="All-time (demo)"
            Icon={CurrencyDollarIcon}
            accent="amber"
          />
          <StatCard
            label="System status"
            value={overview.systemStatus}
            sub="All services nominal"
            Icon={SignalIcon}
            accent="emerald"
          />
        </div>
      </section>
    </div>
  )
}
