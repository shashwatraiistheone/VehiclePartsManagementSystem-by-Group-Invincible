import { getToken } from '../api'

/** Role string from API JWT (e.g. "Admin", "Staff"). */
export function getRoleFromToken(): string | null {
  const t = getToken()
  if (!t) return null
  try {
    const part = t.split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    const payload = JSON.parse(json) as Record<string, unknown>
    const longRole = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const r = payload[longRole] ?? payload.role ?? payload.Role
    if (typeof r === 'string') return r
    return null
  } catch {
    return null
  }
}

export function isAdmin(): boolean {
  return getRoleFromToken() === 'Admin'
}

export function isStaff(): boolean {
  return getRoleFromToken() === 'Staff'
}

export function getUserIdFromToken(): number | null {
  const t = getToken()
  if (!t) return null
  try {
    const part = t.split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>
    const sub = payload.sub ?? payload.userId
    if (typeof sub === 'string') return Number.parseInt(sub, 10)
    if (typeof sub === 'number') return sub
    return null
  } catch {
    return null
  }
}

export function getNameFromToken(): string | null {
  const t = getToken()
  if (!t) return null
  try {
    const part = t.split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>
    const name =
      (typeof payload.name === 'string' && payload.name) ||
      (typeof payload.unique_name === 'string' && payload.unique_name)
    return name || null
  } catch {
    return null
  }
}

/** Display email or username from JWT for profile UI. */
export function getAccountEmailFromToken(): string | null {
  const t = getToken()
  if (!t) return null
  try {
    const part = t.split('.')[1]
    if (!part) return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    const payload = JSON.parse(json) as Record<string, unknown>
    const long =
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress' as const
    const email =
      (typeof payload.email === 'string' && payload.email) ||
      (typeof payload.Email === 'string' && payload.Email) ||
      (typeof payload[long] === 'string' && (payload[long] as string)) ||
      (typeof payload.unique_name === 'string' && payload.unique_name) ||
      (typeof payload.sub === 'string' && payload.sub)
    return email || null
  } catch {
    return null
  }
}
