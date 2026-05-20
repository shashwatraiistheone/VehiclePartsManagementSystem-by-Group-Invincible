import { clearSession as clearStorageSession, getToken } from './authStorage'

export { clearSession, getToken, setToken, persistAuthSession } from './authStorage'

/** Role string from API JWT (e.g. "Admin", "Staff", "Customer"). */
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

export function getStoredRole(): string | null {
  return localStorage.getItem('userRole') ?? getRoleFromToken()
}

export function isAdmin(): boolean {
  const role = getStoredRole()
  return role === 'Admin'
}

export function isStaff(): boolean {
  const role = getStoredRole()
  return role === 'Staff'
}

export function isCustomer(): boolean {
  const role = getStoredRole()
  return role === 'Customer'
}

export function normalizeRole(role: string): 'Admin' | 'Staff' | 'Customer' | null {
  const r = role.trim()
  if (r === 'Admin' || r === 'Staff' || r === 'Customer') return r
  return null
}

/** True when a token exists and role is Admin, Staff, or Customer. */
export function hasValidSession(): boolean {
  const token = getToken()
  if (!token || isTokenExpired(token)) {
    if (token) clearStorageSession()
    return false
  }
  const role = getStoredRole()
  return Boolean(role && normalizeRole(role))
}

function isTokenExpired(token: string): boolean {
  try {
    const part = token.split('.')[1]
    if (!part) return true
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as { exp?: number }
    if (typeof payload.exp !== 'number') return false
    return payload.exp * 1000 < Date.now() - 10_000
  } catch {
    return true
  }
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

/** Staff/admin display name from session (login response or JWT). */
export function getStoredUserName(): string | null {
  return localStorage.getItem('userName') ?? getNameFromToken()
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
