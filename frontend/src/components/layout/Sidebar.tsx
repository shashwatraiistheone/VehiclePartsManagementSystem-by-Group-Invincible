import {
  HomeIcon,
  CubeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarSquareIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'
import { isAdmin } from '../../lib/auth'

export type TabId = 'home' | 'parts' | 'customers' | 'sales' | 'reports' | 'staff'

type Item = { id: TabId; label: string; Icon: typeof HomeIcon; adminOnly?: boolean }

const allItems: Item[] = [
  { id: 'home', label: 'Dashboard', Icon: HomeIcon },
  { id: 'parts', label: 'Parts', Icon: CubeIcon },
  { id: 'customers', label: 'Customers', Icon: UserGroupIcon },
  { id: 'sales', label: 'Sales', Icon: DocumentTextIcon },
  { id: 'reports', label: 'Reports', Icon: ChartBarSquareIcon, adminOnly: true },
  { id: 'staff', label: 'Staff', Icon: UserCircleIcon, adminOnly: true },
]

type Props = {
  active: TabId
  onSelect: (id: TabId) => void
  onLogout: () => void
}

export function Sidebar({ active, onSelect, onLogout }: Props) {
  const showAdmin = isAdmin()
  const items = allItems.filter((i) => !i.adminOnly || showAdmin)

  return (
    <aside className="flex max-h-[min(100dvh,100vh)] min-h-0 w-full shrink-0 flex-col border-b border-slate-800/60 bg-slate-950 text-slate-200 sm:max-h-none md:h-screen md:max-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-slate-800/60 px-4 py-5 sm:px-5 sm:py-6">
        <p className="text-lg font-bold tracking-tight text-white">PartsHub</p>
        <p className="mt-1 text-xs text-slate-500">Vehicle Parts Management</p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Main">
        {items.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              type="button"
              title={label}
              onClick={() => onSelect(id)}
              className={[
                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
                on
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-white',
              ].join(' ')}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-800/60 p-3 sm:p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
