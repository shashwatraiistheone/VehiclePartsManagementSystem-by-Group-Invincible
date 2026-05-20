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
  | 'create-part'
  | 'low-stock-notifications'
  | 'vendors'
  | 'create-vendor'
  | 'purchases'
  | 'create-purchase-invoice'
  | 'financial-reports'
  | 'daily-performance-report'
  | 'monthly-performance-report'
  | 'monthly-top-selling-parts'
  | 'annual-strategic-review'
  | 'appointments'
  | 'part-requests'
  | 'community-reviews'
  | 'loyalty-program'
  | 'audit-logs'
  | 'email-reminder-logs'
  | 'background-jobs'

export const ADMIN_SIDEBAR_PENDING: AdminPageId[] = []

export function isAdminSidebarPending(id: AdminPageId): boolean {
  return ADMIN_SIDEBAR_PENDING.includes(id)
}
