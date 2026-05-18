import {
  UserPlus,
  Search,
  FileText,
  History,
  PieChart,
  ClipboardList,
  CalendarDays,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { StaffViewId } from '../../staff/staffViewId'
import { staffPath } from '../../staff/staffRoutes'
import { StaffDashboardCard } from '../dashboard/StaffDashboardCard'
import { SystemAlerts } from '../dashboard/SystemAlerts'

const tiles: { title: string; description: string; Icon: typeof UserPlus; view: StaffViewId }[] = [
  {
    title: 'Customer registration',
    description: 'Vehicle details and new profiles.',
    Icon: UserPlus,
    view: 'register-customer',
  },
  {
    title: 'Sales & invoices',
    description: 'Record sales and line items.',
    Icon: FileText,
    view: 'sales-history',
  },
  {
    title: 'Customer history',
    description: 'Details and purchase history.',
    Icon: History,
    view: 'manage-customers',
  },
  {
    title: 'Customer reports',
    description: 'Summaries and segments.',
    Icon: PieChart,
    view: 'customer-reports',
  },
  {
    title: 'Customer search',
    description: 'Find by name or phone.',
    Icon: Search,
    view: 'search-sale',
  },
  {
    title: 'Purchase & service history',
    description: 'Past jobs per customer.',
    Icon: ClipboardList,
    view: 'manage-customers',
  },
  {
    title: 'Appointments',
    description: 'Service requests and scheduling.',
    Icon: CalendarDays,
    view: 'appointments',
  },
]

export function StaffHomePage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Staff Dashboard</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Completed operations: customers, sales, history, reports, search, and appointments.
        </p>
      </header>

      {/* Real-time System Alerts & Reminders */}
      <SystemAlerts />

      <section aria-label="Shortcuts">
        <div className="grid min-w-0 auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2">
          {tiles.map((t) => (
            <StaffDashboardCard
              key={t.title}
              title={t.title}
              description={t.description}
              Icon={t.Icon}
              onClick={() => navigate(staffPath(t.view))}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
