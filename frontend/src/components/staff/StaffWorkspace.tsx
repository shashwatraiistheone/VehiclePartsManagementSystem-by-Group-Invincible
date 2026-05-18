import { useEffect, useState } from 'react'
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
import type { Customer, CustomerInput } from './customerModule'
import { INITIAL_CUSTOMERS } from './customerModule'

const STORAGE_KEY = 'partshub_staff_customers_v1'

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

function getInitialState(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_CUSTOMERS
    const parsed = JSON.parse(raw) as Customer[]
    return Array.isArray(parsed) ? parsed : INITIAL_CUSTOMERS
  } catch {
    return INITIAL_CUSTOMERS
  }
}

export function StaffWorkspace({ onLogout }: Props) {
  const [customers, setCustomers] = useState<Customer[]>(() => getInitialState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
  }, [customers])

  function addCustomer(payload: CustomerInput) {
    setCustomers((prev) => [
      {
        id: Date.now(),
        ...payload,
        totalPurchases: 0,
        lastVisit: new Date().toISOString(),
        status: 'Active',
      },
      ...prev,
    ])
  }

  function updateCustomer(id: number, payload: CustomerInput) {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...payload } : c)),
    )
  }

  function deleteCustomer(id: number) {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  function recordSale(customerId: number, totalLines: number) {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              totalPurchases: c.totalPurchases + totalLines,
              lastVisit: new Date().toISOString(),
              status: 'Active',
            }
          : c,
      ),
    )
  }

  return (
    <Routes>
      <Route path="/staff" element={<StaffLayout onLogout={onLogout} />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<StaffHomePage />} />
        <Route path="dashboard" element={<StaffHomePage />} />
        <Route
          path="manage-customers"
          element={
            <CustomerManagementPage
              customers={customers}
              onUpdateCustomer={updateCustomer}
              onDeleteCustomer={deleteCustomer}
            />
          }
        />
        <Route path="register-customer" element={<StaffRegisterCustomerPage onRegister={addCustomer} />} />
        <Route
          path="search-sale"
          element={<StaffSearchSalePage customers={customers} onRecordSale={recordSale} />}
        />
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
