export type AdminPageId =
  | 'home'
  | 'staff-dashboard'
  | 'admin-dashboard'
  | 'staff-management'
  | 'customers'
  | 'search-sale'
  | 'register-customer'
  | 'sales-history'
  | 'credit-management'
  | 'customer-reports'
  | 'generate-invoice'
  | 'inventory'
  | 'appointments'
  | 'part-requests'

export const ADMIN_SIDEBAR_PENDING: AdminPageId[] = ['part-requests']

export function isAdminSidebarPending(id: AdminPageId): boolean {
  return ADMIN_SIDEBAR_PENDING.includes(id)
}
