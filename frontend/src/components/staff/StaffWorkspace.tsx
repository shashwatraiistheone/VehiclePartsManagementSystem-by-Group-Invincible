import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { StaffPanelSidebar } from './StaffPanelSidebar'
import { CustomerManagementPage } from './CustomerManagementPage'
import { StaffHomePage } from './StaffHomePage'
import { StaffDashboardPage } from './StaffDashboardPage'
import { StaffRegisterCustomerPage } from './StaffRegisterCustomerPage'
import { SearchSalePage } from '../sales/SearchSalePage'
import { staffCreateSalePath } from '../../staff/staffRoutes'
import { StaffSalesHistoryPage } from './StaffSalesHistoryPage'
import { StaffReportsPage } from './StaffReportsPage'
import { StaffTopSpendersReportPage } from './reports/StaffTopSpendersReportPage'
import { StaffRegularCustomersReportPage } from './reports/StaffRegularCustomersReportPage'
import { StaffPendingCreditReportPage } from './reports/StaffPendingCreditReportPage'
import { StaffPartRequestsPage } from './StaffPartRequestsPage'
import { StaffCustomerProfilePage } from './customers/StaffCustomerProfilePage'
import { AppointmentsPage } from './AppointmentsPage'
import { StaffAppointmentDetailsPage } from './appointments/StaffAppointmentDetailsPage'
import { StaffCreditManagementPage } from './StaffCreditManagementPage'
import { StaffCreditCollectPaymentPage } from './StaffCreditCollectPaymentPage'
import { AdminReviewsPage } from '../admin/AdminReviewsPage'
import { staffPath } from '../../staff/staffRoutes'

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

/** Legacy invoice URLs → unified Search & Sale with customer pre-selected. */
function LegacyStaffInvoiceRedirect() {
  const { customerId } = useParams<{ customerId: string }>()
  const id = Number(customerId)
  if (!Number.isFinite(id) || id <= 0) {
    return <Navigate to="/staff/search-sale" replace />
  }
  return <Navigate to={staffCreateSalePath(id)} replace />
}

export function StaffWorkspace({ onLogout }: Props) {
  return (
    <Routes>
      <Route path="/staff" element={<StaffLayout onLogout={onLogout} />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<StaffHomePage />} />
        <Route path="dashboard" element={<StaffDashboardPage />} />
        <Route path="manage-customers" element={<CustomerManagementPage />} />
        <Route path="customers/:id" element={<StaffCustomerProfilePage />} />
        <Route path="register-customer" element={<StaffRegisterCustomerPage />} />
        <Route path="search-sale" element={<SearchSalePage />} />
        <Route path="search-sale/:customerId/invoice" element={<LegacyStaffInvoiceRedirect />} />
        <Route path="sales-history" element={<StaffSalesHistoryPage />} />
        <Route path="credit-management" element={<StaffCreditManagementPage />} />
        <Route path="credit-management/:invoiceId/collect" element={<StaffCreditCollectPaymentPage />} />
        <Route path="customer-reports" element={<StaffReportsPage />} />
        <Route path="customer-reports/top-spenders" element={<StaffTopSpendersReportPage />} />
        <Route path="customer-reports/regular-customers" element={<StaffRegularCustomersReportPage />} />
        <Route path="customer-reports/pending-credits" element={<StaffPendingCreditReportPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="appointments/:id" element={<StaffAppointmentDetailsPage />} />
        <Route path="part-requests" element={<StaffPartRequestsPage />} />
        <Route path="community-reviews" element={<AdminReviewsPage />} />
        <Route path="*" element={<Navigate to="/staff/home" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={staffPath('home')} replace />} />
    </Routes>
  )
}
