import type { ComponentType, SVGProps } from 'react'
import {
  CubeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarSquareIcon,
  UserCircleIcon,
  CloudIcon,
} from '@heroicons/react/24/outline'
import { StatCard } from '../ui/StatCard'
import { FeatureGridCard } from '../ui/FeatureGridCard'
import { QuickActions } from './QuickActions'
import { ReportsSection } from './ReportsSection'

import type { TabId } from '../layout/Sidebar'

type Props = {
  onNavigate: (tab: TabId) => void
}

const dummy = {
  totalParts: 128,
  totalCustomers: 45,
  openInvoices: 7,
  salesTodayRs: 125_000,
  status: 'Online',
}

const featureCards: {
  title: string
  description: string
  tab: TabId
  icon: ComponentType<SVGProps<SVGSVGElement>>
}[] = [
  {
    title: 'Parts Management',
    description: 'Add parts, set pricing, and track live inventory across locations.',
    tab: 'parts',
    icon: CubeIcon,
  },
  {
    title: 'Customer Management',
    description: 'Register and manage customers; view service and sales history.',
    tab: 'customers',
    icon: UserGroupIcon,
  },
  {
    title: 'Sales & Invoice Management',
    description: 'Create invoices, record line items, and follow payment status.',
    tab: 'sales',
    icon: DocumentTextIcon,
  },
  {
    title: 'Reports Module',
    description: 'Analytics, exports, and operational views for your team.',
    tab: 'reports',
    icon: ChartBarSquareIcon,
  },
  {
    title: 'Staff Dashboard',
    description: 'Oversee team activity, assignments, and daily performance.',
    tab: 'staff',
    icon: UserCircleIcon,
  },
]

function formatLkr(n: number) {
  return `Rs ${n.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`
}

export function AdminDashboard({ onNavigate }: Props) {
  return (
    <div className="min-h-0 space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, Admin 👋
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Manage vehicle parts inventory, customers, and operations from this dashboard.
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Areas</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((c) => (
            <FeatureGridCard
              key={c.title}
              title={c.title}
              description={c.description}
              Icon={c.icon}
              onClick={() => onNavigate(c.tab)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Quick overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total parts"
            value={String(dummy.totalParts)}
            sub="live catalogue"
            Icon={CubeIcon}
          />
          <StatCard
            label="Total customers"
            value={String(dummy.totalCustomers)}
            sub="registered"
            Icon={UserGroupIcon}
            accent="emerald"
          />
          <StatCard
            label="Open invoices"
            value={String(dummy.openInvoices)}
            sub="awaiting payment"
            Icon={DocumentTextIcon}
          />
          <StatCard
            label="Sales today"
            value={formatLkr(dummy.salesTodayRs)}
            sub="approx. gross"
            Icon={DocumentTextIcon}
            accent="amber"
          />
          <StatCard
            label="System status"
            value={dummy.status}
            sub="All services nominal"
            Icon={CloudIcon}
            accent="emerald"
          />
        </div>
      </section>

      <QuickActions
        onAction={(id) => {
          if (id === 'parts' || id === 'customers' || id === 'sales') onNavigate(id)
        }}
      />

      <ReportsSection />
    </div>
  )
}
