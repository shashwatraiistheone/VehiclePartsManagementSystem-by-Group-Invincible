import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getToken } from './api'
import { isAdmin } from './lib/auth'
import type { AdminPageId } from './admin/adminPages'
import LoginPage from './pages/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { AdminPanelSidebar } from './components/admin/AdminPanelSidebar'
import { AdminHomePage } from './components/admin/AdminHomePage'
import { AdminDashboardPage } from './components/admin/AdminDashboardPage'
import { AdminStaffDashboardPage } from './components/admin/AdminStaffDashboardPage'
import { AdminInventoryPage } from './components/admin/AdminInventoryPage'
import { AdminAppointmentsPage } from './components/admin/AdminAppointmentsPage'
import { AdminSaasPlaceholder, adminPlaceholderCopy } from './components/admin/AdminSaasPlaceholder'
import { StaffWorkspace } from './components/staff/StaffWorkspace'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import CustomerList from './CustomerList.jsx'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import Register from './pages/Register.jsx'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authed, setAuthed] = useState(Boolean(getToken()))
  const [screen, setScreen] = useState<'login' | 'register'>('login')
  const [adminPage, setAdminPage] = useState<AdminPageId>(() =>
    typeof window !== 'undefined' && window.location.pathname === '/appointments' ? 'appointments' : 'home',
  )

  useEffect(() => {
    if (!authed || !isAdmin()) return
    const p = location.pathname
    if (p === '/appointments') {
      setAdminPage((s) => (s !== 'appointments' ? 'appointments' : s))
      return
    }
    setAdminPage((prev) => (prev === 'appointments' ? 'home' : prev))
  }, [location.pathname, authed])

  const setAdminPageWithUrl = useCallback(
    (id: AdminPageId) => {
      setAdminPage(id)
      if (id === 'appointments') navigate('/appointments')
      else if (location.pathname === '/appointments') navigate('/', { replace: true })
    },
    [navigate, location.pathname],
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    setAuthed(false)
    setAdminPage('home')
    navigate('/')
  }

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
      case 'staff-management': {
        const { title, description } = adminPlaceholderCopy('staff-management')
        return (
          <AdminSaasPlaceholder
            title={title}
            description={description}
            onBack={() => setAdminPageWithUrl('home')}
          />
        )
      }
      case 'customers':
        return <CustomerList />
      case 'inventory':
        return <AdminInventoryPage />
      case 'search-sale':
      case 'register-customer':
      case 'sales-history':
      case 'credit-management':
      case 'customer-reports':
      case 'generate-invoice': {
        const { title, description } = adminPlaceholderCopy(adminPage)
        return (
          <AdminSaasPlaceholder
            title={title}
            description={description}
            onBack={() => setAdminPageWithUrl('home')}
          />
        )
      }
      case 'appointments':
        return <AdminAppointmentsPage />
      case 'part-requests':
        return (
          <AdminSaasPlaceholder
            title="Module unavailable"
            description="This section is disabled in the current release."
            onBack={() => setAdminPageWithUrl('home')}
          />
        )
      default:
        return <AdminHomePage onNavigate={setAdminPageWithUrl} />
    }
  }

  if (authed) {
    if (isAdmin()) {
      return (
        <AppShell
          sidebar={
            <AdminPanelSidebar active={adminPage} onSelect={setAdminPageWithUrl} onLogout={handleLogout} />
          }
        >
          <div className="mx-auto w-full max-w-6xl">{renderAdminMain()}</div>
        </AppShell>
      )
    }

    return <StaffWorkspace onLogout={handleLogout} />
  }

  return screen === 'register' ? (
    <Register
      onRegistered={() => setScreen('login')}
      onBackToLogin={() => setScreen('login')}
    />
  ) : (
    <LoginPage
      onLoggedIn={() => setAuthed(true)}
      onGoRegister={() => setScreen('register')}
    />
  )
}
