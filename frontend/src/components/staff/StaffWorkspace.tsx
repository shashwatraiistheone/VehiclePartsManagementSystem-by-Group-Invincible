import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { StaffPanelSidebar } from './StaffPanelSidebar'
import { CustomerManagementPage } from './CustomerManagementPage'
import { StaffHomePage } from './StaffHomePage'
import { StaffRegisterCustomerPage } from './StaffRegisterCustomerPage'
import { StaffSearchSalePage } from './StaffSearchSalePage'
import { StaffSalesHistoryPage } from './StaffSalesHistoryPage'
import { StaffReportsPage } from './StaffReportsPage'
import { AppointmentsPage } from './AppointmentsPage'
import { SectionPlaceholder } from '../../pages/SectionPlaceholder'
import { STAFF_PART_REQUESTS_ENABLED, staffPath } from '../../staff/staffRoutes'

type Props = {
  onLogout: () => void
}

function StaffLayout({ onLogout }: Props) {
  return (
    <AppShell sidebar={<StaffPanelSidebar onLogout={onLogout} />}>
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        <Outlet />
      </div>
    </AppShell>
  )
}

export function StaffWorkspace({ onLogout }: Props) {
  return (
    <Routes>
      <Route path="/staff" element={<StaffLayout onLogout={onLogout} />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<StaffHomePage />} />
        <Route path="dashboard" element={<StaffHomePage />} />
        <Route path="manage-customers" element={<CustomerManagementPage />} />
        <Route path="register-customer" element={<StaffRegisterCustomerPage />} />
        <Route path="search-sale" element={<StaffSearchSalePage />} />
        <Route path="sales-history" element={<StaffSalesHistoryPage />} />
        <Route
          path="credit-management"
          element={
            <SectionPlaceholder
              title="Credit Management"
              description="Track customer credit limits, balances, and payment plans. This module will connect to billing when available."
            />
          }
        />
        <Route path="customer-reports" element={<StaffReportsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route
          path="part-requests"
          element={
            STAFF_PART_REQUESTS_ENABLED ? (
              <SectionPlaceholder
                title="Part Requests"
                description="Internal and customer part requests will appear here."
              />
            ) : (
              <Navigate to={staffPath('home')} replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/staff/home" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/staff/home" replace />} />
    </Routes>
  )
}
