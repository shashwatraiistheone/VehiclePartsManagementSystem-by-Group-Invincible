import { APP_NAME } from '../../lib/appBranding'
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  PlusCircleIcon,
  ShoppingBagIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
  TruckIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import type { CustomerNavId } from './types'

type NavItem = {
  id: CustomerNavId
  label: string
  Icon: typeof HomeIcon
  badge?: number
  badgeLabel?: string
}

type NavGroup = {
  heading: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'MAIN',
    items: [
      { id: 'home', label: 'Home', Icon: HomeIcon },
      { id: 'dashboard', label: 'My Dashboard', Icon: Squares2X2Icon },
    ],
  },
  {
    heading: 'MY ACCOUNT',
    items: [
      { id: 'profile-vehicles', label: 'Profile & Vehicles', Icon: UserCircleIcon },
      { id: 'add-vehicle', label: 'Add Vehicle', Icon: PlusCircleIcon },
      { id: 'purchase-history', label: 'Purchase History', Icon: ShoppingBagIcon },
      { id: 'service-records', label: 'Service Records', Icon: ClipboardDocumentListIcon },
    ],
  },
  {
    heading: 'SERVICES',
    items: [
      { id: 'book-service', label: 'Book Service', Icon: CalendarDaysIcon },
      { id: 'my-appointments', label: 'My Appointments', Icon: CalendarDaysIcon },
      { id: 'request-part', label: 'Request a Part', Icon: ChartBarIcon },
      { id: 'my-part-requests', label: 'My Part Requests', Icon: TruckIcon },
    ],
  },
  {
    heading: 'COMMUNITY',
    items: [
      { id: 'leave-review', label: 'Leave a Review', Icon: StarIcon },
      { id: 'community-reviews', label: 'Community Feedback', Icon: StarIcon },
      { id: 'ai-suggestions', label: 'Predictive Maintenance', Icon: SparklesIcon, badgeLabel: 'NEW' },
    ],
  },
  {
    heading: 'GENERAL',
    items: [{ id: 'notifications', label: 'Notifications', Icon: BellIcon }],
  },
]

type Props = {
  activeNavId: CustomerNavId
  onSelect: (id: CustomerNavId) => void
  onLogout: () => void
  unreadCount: number
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function CustomerSidebar({
  activeNavId,
  onSelect,
  onLogout,
  unreadCount,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const content = (
    <>
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <WrenchScrewdriverIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Customer Portal</p>
            <p className="text-base font-bold text-white">{APP_NAME}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.heading} className={groupIndex > 0 ? 'mt-6' : ''}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ id, label, Icon, badgeLabel }) => {
                const isActive = activeNavId === id
                const badge = id === 'notifications' ? unreadCount : undefined
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(id)
                        onCloseMobile()
                      }}
                      className={[
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition',
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
                      ].join(' ')}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`}
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {badgeLabel ? (
                        <span
                          className={[
                            'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                            isActive ? 'bg-emerald-400/30 text-emerald-100' : 'bg-emerald-500 text-white',
                          ].join(' ')}
                        >
                          {badgeLabel}
                        </span>
                      ) : null}
                      {badge != null && badge > 0 ? (
                        <span
                          className={[
                            'min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold',
                            isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white',
                          ].join(' ')}
                        >
                          {badge > 9 ? '9+' : badge}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={() => {
            onCloseMobile()
            onLogout()
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-red-400"
        >
          <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </>
  )

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 shadow-2xl transition-transform duration-200 ease-out lg:static lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {content}
      </aside>
    </>
  )
}
