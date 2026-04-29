import { ChartBarIcon, CubeIcon, UserGroupIcon } from '@heroicons/react/24/outline'

const items = [
  { title: 'Sales Report', desc: 'Revenue, top parts, and trends', icon: ChartBarIcon },
  { title: 'Inventory Report', desc: 'Stock levels and low supply', icon: CubeIcon },
  { title: 'Customer Report', desc: 'Accounts and order history', icon: UserGroupIcon },
]

export function ReportsSection() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Reports</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map(({ title, desc, icon: Icon }) => (
          <li
            key={title}
            className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition hover:border-blue-200 hover:bg-white"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/60">
              <Icon className="h-5 w-5 text-blue-600" />
            </span>
            <div>
              <p className="font-semibold text-slate-900">{title}</p>
              <p className="text-sm text-slate-600">{desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
