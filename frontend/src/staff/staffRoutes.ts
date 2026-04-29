import type { StaffViewId } from './staffViewId'

/** Base path for all staff SPA routes */
export const STAFF_BASE_PATH = '/staff'

/** Absolute URL path for a staff view (stable for NavLink targets). */
export function staffPath(view: StaffViewId): string {
  return `${STAFF_BASE_PATH}/${view}`
}

/** Set true when Part Requests UI is wired; hides nav item while false */
export const STAFF_PART_REQUESTS_ENABLED = false
