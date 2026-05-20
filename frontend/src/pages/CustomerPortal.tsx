import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { getUserIdFromToken, getNameFromToken } from '../lib/auth'
import {
  fetchCustomerHistory,
  fetchMyNotifications,
  fetchMyProfile,
  fetchVehicles,
  type CustomerDetail,
  type CustomerHistory,
  type CustomerNotification,
} from '../services/customerApi'
import { fetchMyPartRequests, type PartRequest } from '../services/partRequestApi'
import { fetchMyReviews, type Review } from '../services/reviewApi'
import { fetchMyPredictions, type MaintenancePrediction } from '../services/predictionApi'
import { fetchMyAppointments, type Appointment } from '../services/appointmentApi'
import { CustomerSidebar } from '../components/customer-portal/CustomerSidebar'
import { CustomerHome } from '../components/customer-portal/CustomerHome'
import { LeaveReviewPage } from '../components/customer-portal/LeaveReviewPage'
import { CommunityReviewsPage } from '../components/customer-portal/CommunityReviewsPage'
import { MaintenanceAiPage } from '../components/customer-portal/MaintenanceAiPage'
import { CustomerMyDashboard } from '../components/customer-portal/CustomerMyDashboard'
import { LoadingState } from '../components/customer-portal/shared'
import type { CustomerNavId } from '../components/customer-portal/types'
import { NAV_SELECTIONS } from '../components/customer-portal/types'
import { ProfileSection } from '../components/customer-portal/CustomerProfileSection'
import {
  NotificationsSection,
  PurchasesSection,
  VehiclesSection,
} from '../components/customer-portal/CustomerSections'
import { CustomerServicePage } from '../components/customer-portal/CustomerServicePage'
import { BookServicePage } from '../components/customer-portal/BookServicePage'
import { MyAppointmentsPage } from '../components/customer-portal/MyAppointmentsPage'
import { RequestPartPage } from '../components/customer-portal/RequestPartPage'
import { MyPartRequestsPage } from '../components/customer-portal/MyPartRequestsPage'

const CUSTOMER_PATH_TO_NAV: Record<string, CustomerNavId> = {
  '/book-service': 'book-service',
  '/service-records': 'service-records',
  '/my-appointments': 'my-appointments',
  '/customer/community-reviews': 'community-reviews',
  '/customer/submit-review': 'leave-review',
  '/customer/predictive-maintenance': 'ai-suggestions',
}

const CUSTOMER_NAV_TO_PATH: Partial<Record<CustomerNavId, string>> = {
  'book-service': '/book-service',
  'service-records': '/service-records',
  'my-appointments': '/my-appointments',
  'community-reviews': '/customer/community-reviews',
  'leave-review': '/customer/submit-review',
  'ai-suggestions': '/customer/predictive-maintenance',
}

const CUSTOMER_ROUTED_PATHS = new Set([
  '/book-service',
  '/service-records',
  '/my-appointments',
  '/customer/community-reviews',
  '/customer/submit-review',
  '/customer/predictive-maintenance',
])

function navIdFromPath(pathname: string): CustomerNavId | null {
  return CUSTOMER_PATH_TO_NAV[pathname] ?? null
}

export default function CustomerPortal(props: { onLogout: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const customerId = getUserIdFromToken()
  const displayName = getNameFromToken() ?? 'Customer'
  const [activeNavId, setActiveNavId] = useState<CustomerNavId>(() => {
    return navIdFromPath(location.pathname) ?? 'home'
  })
  const tab = NAV_SELECTIONS[activeNavId].tab
  const [mobileNav, setMobileNav] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<CustomerDetail | null>(null)
  const [history, setHistory] = useState<CustomerHistory | null>(null)
  const [vehicles, setVehicles] = useState(profile?.vehicles ?? [])
  const [partRequests, setPartRequests] = useState<PartRequest[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([])
  const [predictionsError, setPredictionsError] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])

  const load = useCallback(async () => {
    if (!customerId) {
      setError('Unable to load your account. Please sign in again.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    setPredictionsError(null)
    try {
      const [detail, hist, veh, reqs, revs, preds, appts, notifs] = await Promise.all([
        fetchMyProfile(),
        fetchCustomerHistory(customerId),
        fetchVehicles(customerId),
        fetchMyPartRequests(),
        fetchMyReviews(),
        fetchMyPredictions().catch((e) => {
          setPredictionsError(e instanceof Error ? e.message : 'Failed to load predictions')
          return [] as MaintenancePrediction[]
        }),
        fetchMyAppointments().catch(() => [] as Appointment[]),
        fetchMyNotifications().catch(() => [] as CustomerNotification[]),
      ])
      setProfile(detail)
      setHistory(hist)
      setVehicles(veh)
      setPartRequests(reqs)
      setReviews(revs)
      setPredictions(preds)
      setPredictionsError(null)
      setAppointments(appts)
      setNotifications(notifs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portal')
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const fromPath = navIdFromPath(location.pathname)
    if (fromPath && fromPath !== activeNavId) {
      setActiveNavId(fromPath)
    }
  }, [location.pathname, activeNavId])

  const navigateTo = useCallback(
    (navId: CustomerNavId) => {
      setActiveNavId(navId)
      const path = CUSTOMER_NAV_TO_PATH[navId]
      if (path) {
        if (location.pathname !== path) navigate(path)
        return
      }
      if (CUSTOMER_ROUTED_PATHS.has(location.pathname)) {
        navigate('/', { replace: true })
      }
    },
    [navigate, location.pathname],
  )

  const unreadCount = notifications.filter((n) => !n.isRead).length

  function renderContent() {
    if (loading) return <LoadingState />
    if (error) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {error}
          <button type="button" onClick={() => void load()} className="ml-3 font-semibold underline">
            Retry
          </button>
        </div>
      )
    }
    if (!profile || !history) return null

    switch (tab) {
      case 'home':
        return (
          <CustomerHome
            customerName={displayName}
            profile={profile}
            history={history}
            appointments={appointments}
            partRequests={partRequests}
            onNavigate={navigateTo}
          />
        )
      case 'insights':
        return (
          <CustomerMyDashboard
            customerId={profile.id}
            customerName={displayName}
            profile={profile}
            history={history}
            vehicles={vehicles}
            appointments={appointments}
            predictions={predictions}
            predictionsError={predictionsError}
            onVehiclesChange={setVehicles}
            onNavigate={navigateTo}
          />
        )
      case 'profile':
        return (
          <ProfileSection
            customerId={profile.id}
            profile={profile}
            vehicles={vehicles}
            onUpdated={setProfile}
            onVehiclesChange={setVehicles}
          />
        )
      case 'vehicles':
        return (
          <VehiclesSection
            customerId={profile.id}
            vehicles={vehicles}
            onChange={setVehicles}
            initialShowAdd={activeNavId === 'add-vehicle'}
          />
        )
      case 'purchases':
        return <PurchasesSection history={history} onNavigate={navigateTo} />
      case 'services':
        return (
          <CustomerServicePage
            vehicles={vehicles}
            appointments={appointments}
            onAppointmentsChange={setAppointments}
            onNavigate={navigateTo}
          />
        )
      case 'appointments':
        if (activeNavId === 'book-service') {
          return (
            <BookServicePage
              vehicles={vehicles}
              onAppointmentsChange={setAppointments}
              onNavigate={navigateTo}
            />
          )
        }
        if (activeNavId === 'my-appointments') {
          return (
            <MyAppointmentsPage
              vehicles={vehicles}
              appointments={appointments}
              onAppointmentsChange={setAppointments}
              onNavigate={navigateTo}
            />
          )
        }
        return null
      case 'requests':
        if (activeNavId === 'request-part') {
          return (
            <RequestPartPage
              vehicles={vehicles}
              onRequestsChange={setPartRequests}
              onNavigate={navigateTo}
            />
          )
        }
        return (
          <MyPartRequestsPage
            requests={partRequests}
            onChange={setPartRequests}
            onNavigate={navigateTo}
          />
        )
      case 'reviews':
        return <LeaveReviewPage onNavigate={navigateTo} />
      case 'community-reviews':
        return <CommunityReviewsPage onNavigate={navigateTo} />
      case 'notifications':
        return <NotificationsSection notifications={notifications} />
      case 'ai':
        return (
          <MaintenanceAiPage
            vehicles={vehicles}
            onNavigate={navigateTo}
            displayName={displayName}
            onLogout={props.onLogout}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <CustomerSidebar
        activeNavId={activeNavId}
        onSelect={navigateTo}
        onLogout={props.onLogout}
        unreadCount={unreadCount}
        mobileOpen={mobileNav}
        onCloseMobile={() => setMobileNav(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Welcome back</p>
              <h1 className="text-lg font-bold text-slate-900">{displayName}</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  )
}
