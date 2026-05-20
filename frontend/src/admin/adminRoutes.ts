/** Admin deep-link paths (React Router). */
export const ADMIN_INVENTORY_PATH = '/Admin/ManageParts'
export const ADMIN_CREATE_PART_PATH = '/Admin/CreatePart'
export const ADMIN_LOW_STOCK_NOTIFICATIONS_PATH = '/Admin/LowStockNotifications'
export const ADMIN_PURCHASE_INVOICES_PATH = '/Admin/ManagePurchaseInvoices'
export const ADMIN_CREATE_PURCHASE_INVOICE_PATH = '/Admin/CreatePurchaseInvoice'

export type AdminNavigateOptions = {
  highlightPartId?: number
  /** When true, inventory table shows only the target part (from notification deep-link). */
  focusPartOnly?: boolean
}

export function parsePartIdFromSearch(search: string): number | null {
  const params = new URLSearchParams(search)
  const raw = params.get('partId') ?? params.get('partid')
  if (!raw) return null
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function parseFocusFromSearch(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get('focus') === '1' || params.get('focusOnly') === 'true'
}

export function buildInventoryPath(partId?: number, focusPartOnly = false): string {
  if (!partId) return ADMIN_INVENTORY_PATH
  const params = new URLSearchParams({ partId: String(partId) })
  if (focusPartOnly) params.set('focus', '1')
  return `${ADMIN_INVENTORY_PATH}?${params.toString()}`
}

export function isInventoryPath(pathname: string): boolean {
  return (
    pathname === ADMIN_INVENTORY_PATH ||
    pathname === '/admin/manage-parts' ||
    pathname === '/admin/inventory'
  )
}

export function isCreatePartPath(pathname: string): boolean {
  return pathname === ADMIN_CREATE_PART_PATH || pathname === '/admin/create-part'
}

export function isLowStockNotificationsPath(pathname: string): boolean {
  return (
    pathname === ADMIN_LOW_STOCK_NOTIFICATIONS_PATH ||
    pathname === '/admin/low-stock-notifications'
  )
}

export function isPurchaseInvoicesPath(pathname: string): boolean {
  return (
    pathname === ADMIN_PURCHASE_INVOICES_PATH ||
    pathname === '/admin/manage-purchase-invoices'
  )
}

export function isCreatePurchaseInvoicePath(pathname: string): boolean {
  return (
    pathname === ADMIN_CREATE_PURCHASE_INVOICE_PATH ||
    pathname === '/admin/create-purchase-invoice'
  )
}
