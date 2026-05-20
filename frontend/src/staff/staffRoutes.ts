import type { StaffViewId } from './staffViewId'

/** Base path for all staff SPA routes */
export const STAFF_BASE_PATH = '/staff'

/** Absolute URL path for a staff view (stable for NavLink targets). */
export function staffPath(view: StaffViewId): string {
  return `${STAFF_BASE_PATH}/${view}`
}

export function staffCustomerProfilePath(customerId: number): string {
  return `${STAFF_BASE_PATH}/customers/${customerId}`
}

export function staffCreateSalePath(customerId: number): string {
  return `${STAFF_BASE_PATH}/search-sale?customerId=${customerId}`
}

export function staffCreditCollectPath(invoiceId: number): string {
  return `${STAFF_BASE_PATH}/credit-management/${invoiceId}/collect`
}

export function staffTopSpendersReportPath(): string {
  return `${STAFF_BASE_PATH}/customer-reports/top-spenders`
}

export function staffRegularCustomersReportPath(): string {
  return `${STAFF_BASE_PATH}/customer-reports/regular-customers`
}

export function staffPendingCreditReportPath(): string {
  return `${STAFF_BASE_PATH}/customer-reports/pending-credits`
}

export function staffAppointmentDetailsPath(appointmentId: number): string {
  return `${STAFF_BASE_PATH}/appointments/${appointmentId}`
}

/** Part Requests feature is enabled for staff navigation */
export const STAFF_PART_REQUESTS_ENABLED = true
