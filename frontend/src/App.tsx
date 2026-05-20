import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthSessionManager } from './components/auth/AuthSessionManager'
import { clearSession, hasValidSession, isAdmin, isCustomer, isStaff, normalizeRole } from './lib/auth'
import type { AdminPageId } from './admin/adminPages'
import {
  type AdminNavigateOptions,
  ADMIN_CREATE_PART_PATH,
  ADMIN_CREATE_PURCHASE_INVOICE_PATH,
  ADMIN_INVENTORY_PATH,
  ADMIN_LOW_STOCK_NOTIFICATIONS_PATH,
  ADMIN_PURCHASE_INVOICES_PATH,
  buildInventoryPath,
  isCreatePartPath,
  isCreatePurchaseInvoicePath,
  isInventoryPath,
  isLowStockNotificationsPath,
  isPurchaseInvoicesPath,
  parseFocusFromSearch,
  parsePartIdFromSearch,
} from './admin/adminRoutes'
import LoginPage from './pages/LoginPage'
import CustomerRegister from './pages/CustomerRegister'
import CustomerPortal from './pages/CustomerPortal'
import { PredictiveMaintenancePublicPage } from './pages/PredictiveMaintenancePublicPage'

const PREDICTIVE_MAINTENANCE_PATH = '/customer/predictive-maintenance'
const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect'
import { AppShell } from './components/layout/AppShell'
import { AdminPanelSidebar } from './components/admin/AdminPanelSidebar'
import { AdminHomePage } from './components/admin/AdminHomePage'
import { AdminDashboardPage } from './components/admin/AdminDashboardPage'
import { AdminStaffDashboardPage } from './components/admin/AdminStaffDashboardPage'
import { AdminInventoryPage } from './components/admin/AdminInventoryPage'
import { AdminAppointmentsPage } from './components/admin/AdminAppointmentsPage'
import { AdminSearchSalePage } from './components/admin/AdminSearchSalePage'
import { AdminRegisterCustomerPage } from './components/admin/AdminRegisterCustomerPage'
import StaffListPage from './pages/StaffListPage'
import VendorListPage from './pages/VendorListPage'
import CreateVendorPage from './pages/CreateVendorPage'
import CreatePartPage from './pages/CreatePartPage'
import LowStockNotificationsPage from './pages/LowStockNotificationsPage'
import ManagePurchaseInvoicesPage from './pages/ManagePurchaseInvoicesPage'
import CreatePurchaseInvoicePage from './pages/CreatePurchaseInvoicePage'
import { FinancialReportsPage } from './components/admin/FinancialReportsPage'
import { MonthlyTopSellingPartsPage } from './components/admin/MonthlyTopSellingPartsPage'
import { AnnualStrategicReviewPage } from './components/admin/AnnualStrategicReviewPage'
import {
  DailyPerformanceReportPage,
  MonthlyPerformanceReportPage,
} from './components/admin/PerformanceOverviewPage'
import { SalesHistoryPage } from './components/sales/SalesHistoryPage'
import PrintInvoicePage from './pages/PrintInvoicePage'
import { StaffReportsPage } from './components/staff/StaffReportsPage'
import { AdminPartRequestsPage } from './components/admin/AdminPartRequestsPage'
import { AdminReviewsPage } from './components/admin/AdminReviewsPage'
import { AuditLogsPage } from './components/admin/AuditLogsPage'
import { EmailReminderLogsPage } from './components/admin/EmailReminderLogsPage'
import { BackgroundJobsDashboardPage } from './components/admin/BackgroundJobsDashboardPage'
import { LoyaltyProgramPage } from './components/admin/LoyaltyProgramPage'
import { AdminSaasPlaceholder, adminPlaceholderCopy } from './components/admin/AdminSaasPlaceholder'
import { StaffWorkspace } from './components/staff/StaffWorkspace'
import { CreditManagementPage } from './components/admin/CreditManagementPage'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import CustomerList from './CustomerList.jsx'
export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authed, setAuthed] = useState(() => {
    if (!hasValidSession()) {
      clearSession()
      return false
    }
    return true
  })
  const [screen, setScreen] = useState<'login' | 'register'>('login')
  const [vendorCreatedToast, setVendorCreatedToast] = useState(false)
  const [partCreatedToast, setPartCreatedToast] = useState(false)
  const [highlightPartId, setHighlightPartId] = useState<number | null>(() =>
    typeof window === 'undefined' ? null : parsePartIdFromSearch(window.location.search),
  )
  const [focusPartOnly, setFocusPartOnly] = useState(() =>
    typeof window === 'undefined' ? false : parseFocusFromSearch(window.location.search),
  )
  const [adminPage, setAdminPage] = useState<AdminPageId>(() => {
    if (typeof window === 'undefined') return 'home'
    const p = window.location.pathname
    if (p === '/appointments') return 'appointments'
    if (p === '/part-requests') return 'part-requests'
    if (isLowStockNotificationsPath(p)) return 'low-stock-notifications'
    if (isCreatePartPath(p)) return 'create-part'
    if (isInventoryPath(p)) return 'inventory'
    if (isCreatePurchaseInvoicePath(p)) return 'create-purchase-invoice'
    if (isPurchaseInvoicesPath(p)) return 'purchases'
    return 'home'
  })

  useEffect(() => {
    if (authed && !hasValidSession()) {
      clearSession()
      setAuthed(false)
    }
  }, [authed])

  useEffect(() => {
    if (!authed || !isAdmin()) return
    const p = location.pathname
    if (p === '/appointments') {
      setAdminPage((s) => (s !== 'appointments' ? 'appointments' : s))
      return
    }
    if (p === '/part-requests') {
      setAdminPage((s) => (s !== 'part-requests' ? 'part-requests' : s))
      return
    }
    if (isLowStockNotificationsPath(p)) {
      setAdminPage((s) => (s !== 'low-stock-notifications' ? 'low-stock-notifications' : s))
      return
    }
    if (isInventoryPath(p)) {
      setAdminPage((s) => (s !== 'inventory' ? 'inventory' : s))
      const partId = parsePartIdFromSearch(location.search)
      setHighlightPartId(partId)
      setFocusPartOnly(parseFocusFromSearch(location.search))
      return
    }
    if (isPurchaseInvoicesPath(p)) {
      setAdminPage((s) => (s !== 'purchases' ? 'purchases' : s))
      return
    }
    if (isCreatePurchaseInvoicePath(p)) {
      setAdminPage((s) => (s !== 'create-purchase-invoice' ? 'create-purchase-invoice' : s))
      return
    }
    setAdminPage((prev) =>
      prev === 'appointments' ||
      prev === 'part-requests' ||
      prev === 'low-stock-notifications' ||
      prev === 'inventory' ||
      prev === 'purchases' ||
      prev === 'create-purchase-invoice'
        ? 'home'
        : prev,
    )
  }, [location.pathname, location.search, authed])

  const clearInventoryDeepLink = useCallback(() => {
    setHighlightPartId(null)
    setFocusPartOnly(false)
    if (isInventoryPath(location.pathname)) {
      navigate(ADMIN_INVENTORY_PATH, { replace: true })
    }
  }, [navigate, location.pathname])

  const setAdminPageWithUrl = useCallback(
    (id: AdminPageId, options?: AdminNavigateOptions) => {
      setAdminPage(id)
      if (options?.highlightPartId != null) {
        setHighlightPartId(options.highlightPartId)
        setFocusPartOnly(Boolean(options.focusPartOnly))
      } else if (id !== 'inventory') {
        setHighlightPartId(null)
        setFocusPartOnly(false)
      }

      if (id === 'appointments') navigate('/appointments')
      else if (id === 'part-requests') navigate('/part-requests')
      else if (id === 'low-stock-notifications') navigate(ADMIN_LOW_STOCK_NOTIFICATIONS_PATH)
      else if (id === 'create-part') navigate(ADMIN_CREATE_PART_PATH)
      else if (id === 'purchases') navigate(ADMIN_PURCHASE_INVOICES_PATH)
      else if (id === 'create-purchase-invoice') navigate(ADMIN_CREATE_PURCHASE_INVOICE_PATH)
      else if (id === 'inventory') {
        navigate(
          buildInventoryPath(
            options?.highlightPartId,
            Boolean(options?.focusPartOnly && options?.highlightPartId),
          ),
        )
      } else if (
        isInventoryPath(location.pathname) ||
        isLowStockNotificationsPath(location.pathname) ||
        isCreatePartPath(location.pathname) ||
        location.pathname === '/appointments' ||
        location.pathname === '/part-requests'
      ) {
        navigate('/', { replace: true })
      }
    },
    [navigate, location.pathname],
  )

  const handleLogout = useCallback(() => {
    clearSession()
    setAuthed(false)
    setAdminPage('home')
    navigate('/')
  }, [navigate])

  function renderAdminMain() {
    switch (adminPage) {
      case 'home':
        return <AdminHomePage onNavigate={setAdminPageWithUrl} />
      case 'staff-dashboard':
        return (
          <AdminStaffDashboardPage
            onNavigate={(p) =>
              setAdminPageWithUrl(
                p === 'inventory' ? 'inventory' : p === 'customers' ? 'customers' : 'sales-history',
              )
            }
          />
        )
      case 'admin-dashboard':
        return <AdminDashboardPage onNavigate={setAdminPageWithUrl} />
      case 'staff-management':
        return <StaffListPage onBack={() => setAdminPageWithUrl('home')} />
      case 'vendors':
        return (
          <VendorListPage
            onBack={() => setAdminPageWithUrl('home')}
            onNavigateCreate={() => setAdminPageWithUrl('create-vendor')}
            showCreatedToast={vendorCreatedToast}
            onDismissCreatedToast={() => setVendorCreatedToast(false)}
          />
        )
      case 'create-vendor':
        return (
          <CreateVendorPage
            onCancel={() => setAdminPageWithUrl('vendors')}
            onSuccess={() => {
              setVendorCreatedToast(true)
              setAdminPageWithUrl('vendors')
            }}
          />
        )
      case 'purchases':
        return (
          <ManagePurchaseInvoicesPage
            onBack={() => setAdminPageWithUrl('home')}
            onNavigateCreate={() => setAdminPageWithUrl('create-purchase-invoice')}
          />
        )
      case 'create-purchase-invoice':
        return (
          <CreatePurchaseInvoicePage
            onCancel={() => setAdminPageWithUrl('purchases')}
            onSuccess={() => setAdminPageWithUrl('purchases')}
          />
        )
      case 'financial-reports':
        return <FinancialReportsPage onBack={() => setAdminPageWithUrl('home')} />
      case 'daily-performance-report':
        return <DailyPerformanceReportPage onBack={() => setAdminPageWithUrl('home')} />
      case 'monthly-performance-report':
        return <MonthlyPerformanceReportPage onBack={() => setAdminPageWithUrl('home')} />
      case 'monthly-top-selling-parts':
        return <MonthlyTopSellingPartsPage onBack={() => setAdminPageWithUrl('home')} />
      case 'annual-strategic-review':
        return <AnnualStrategicReviewPage onBack={() => setAdminPageWithUrl('home')} />
      case 'customers':
        return <CustomerList onNavigate={setAdminPageWithUrl} />
      case 'inventory':
        return (
          <AdminInventoryPage
            highlightPartId={highlightPartId}
            focusPartOnly={focusPartOnly}
            onClearHighlight={clearInventoryDeepLink}
            onViewAllNotifications={() => setAdminPageWithUrl('low-stock-notifications')}
            onNavigateCreate={() => setAdminPageWithUrl('create-part')}
            showCreatedToast={partCreatedToast}
            onDismissCreatedToast={() => setPartCreatedToast(false)}
          />
        )
      case 'create-part':
        return (
          <CreatePartPage
            onCancel={() => setAdminPageWithUrl('inventory')}
            onSuccess={() => {
              setPartCreatedToast(true)
              setAdminPageWithUrl('inventory')
            }}
          />
        )
      case 'low-stock-notifications':
        return (
          <LowStockNotificationsPage
            onBack={() => setAdminPageWithUrl('inventory')}
            onNavigate={setAdminPageWithUrl}
          />
        )
      case 'search-sale':
        return <AdminSearchSalePage />
      case 'register-customer':
        return <AdminRegisterCustomerPage onDone={() => setAdminPageWithUrl('customers')} />
      case 'credit-management':
        return <CreditManagementPage />
      case 'customer-reports':
        return <StaffReportsPage />
      case 'sales-history':
        return <SalesHistoryPage />
      case 'generate-invoice':
        return <AdminSearchSalePage />
      case 'appointments':
        return <AdminAppointmentsPage />
      case 'part-requests':
        return <AdminPartRequestsPage />
      case 'community-reviews':
        return <AdminReviewsPage />
      case 'loyalty-program':
        return <LoyaltyProgramPage onBack={() => setAdminPageWithUrl('home')} />
      case 'audit-logs':
        return <AuditLogsPage onBack={() => setAdminPageWithUrl('home')} />
      case 'email-reminder-logs':
        return <EmailReminderLogsPage onBack={() => setAdminPageWithUrl('home')} />
      case 'background-jobs':
        return <BackgroundJobsDashboardPage onBack={() => setAdminPageWithUrl('home')} />
      default:
        return <AdminHomePage onNavigate={setAdminPageWithUrl} />
    }
  }

  const handleAuthSuccess = (role: string) => {
    const normalized = normalizeRole(role)
    if (normalized) {
      localStorage.setItem('userRole', normalized)
    }
    setAuthed(true)
    if (normalized === 'Admin') {
      setAdminPage('home')
    }
    const redirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
    if (redirect && normalized === 'Customer') {
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
      navigate(redirect)
    }
  }

  const sessionExpired = useCallback(() => {
    clearSession()
    setAuthed(false)
    setAdminPage('home')
    navigate('/')
  }, [navigate])

  if (authed && hasValidSession()) {
    const sessionGuard = <AuthSessionManager onSessionExpired={sessionExpired} />

    if (/^\/invoice\/print\/\d+/.test(location.pathname)) {
      return (
        <>
          {sessionGuard}
          <PrintInvoicePage />
        </>
      )
    }

    if (isCustomer()) {
      return (
        <>
          {sessionGuard}
          <CustomerPortal onLogout={handleLogout} />
        </>
      )
    }

    if (isAdmin()) {
      return (
        <>
          {sessionGuard}
          <AppShell
            sidebar={
              <AdminPanelSidebar active={adminPage} onSelect={setAdminPageWithUrl} onLogout={handleLogout} />
            }
          >
          <div className="mx-auto w-full max-w-7xl px-1 sm:px-2">{renderAdminMain()}</div>
        </AppShell>
        </>
      )
    }

    if (isStaff()) {
      return (
        <>
          {sessionGuard}
          <StaffWorkspace onLogout={handleLogout} />
        </>
      )
    }

  }

  if (location.pathname === PREDICTIVE_MAINTENANCE_PATH) {
    return (
      <PredictiveMaintenancePublicPage
        onLogin={() => {
          sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, PREDICTIVE_MAINTENANCE_PATH)
          navigate('/')
        }}
        onRegister={() => {
          sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, PREDICTIVE_MAINTENANCE_PATH)
          setScreen('register')
          navigate('/')
        }}
      />
    )
  }

  return screen === 'register' ? (
    <CustomerRegister onRegistered={handleAuthSuccess} onBackToLogin={() => setScreen('login')} />
  ) : (
    <LoginPage onLoggedIn={handleAuthSuccess} onGoRegister={() => setScreen('register')} />
  )
}
