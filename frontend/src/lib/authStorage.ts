/** Token and session keys — shared by api client and legacy fetch API. */

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function clearSession() {
  clearToken()
  localStorage.removeItem('userId')
  localStorage.removeItem('userName')
  localStorage.removeItem('userRole')
}

export function persistAuthSession(res: {
  token: string
  userId: number
  name: string
  role: string
}) {
  setToken(res.token)
  localStorage.setItem('userId', String(res.userId))
  localStorage.setItem('userName', res.name)
  localStorage.setItem('userRole', res.role)
}
