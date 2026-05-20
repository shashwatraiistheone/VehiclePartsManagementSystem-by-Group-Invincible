import { extractApiErrorMessage, SESSION_EXPIRED_MESSAGE } from './lib/apiClient'
import { clearSession, getToken } from './lib/authStorage'

export { getToken, setToken, clearSession } from './lib/authStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

function requireBaseUrl(): string {
  if (!API_BASE_URL?.trim()) {
    throw new Error('Missing VITE_API_BASE_URL. Add it to frontend/.env')
  }
  return API_BASE_URL.replace(/\/$/, '')
}

async function request<T>(
  path: string,
  opts: { method?: string; token?: string; body?: unknown; skipAuthRedirect?: boolean } = {},
): Promise<T> {
  const baseUrl = requireBaseUrl()
  const method = opts.method ?? 'GET'
  const token = opts.token ?? getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !path.includes('/api/auth/login') && !opts.skipAuthRedirect) {
      clearSession()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app:unauthorized'))
      }
      throw new Error(SESSION_EXPIRED_MESSAGE)
    }

    const d = data as Record<string, unknown> | null
    const message =
      (typeof d?.message === 'string' && d.message) ||
      (typeof d?.detail === 'string' && d.detail) ||
      (typeof d?.title === 'string' && d.title) ||
      (res.status === 403
        ? 'You are not authorized to access this page.'
        : res.status === 404
          ? 'The requested resource was not found.'
          : 'Something went wrong. Please try again.')

    throw new Error(message)
  }

  return data as T
}

export type LoginResponse = {
  token: string
  userId: number
  name: string
  email: string
  role: string
}

export async function login(email: string, password: string) {
  const raw = await request<Record<string, unknown>>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuthRedirect: true,
  })
  return {
    token: String(raw.token ?? raw.Token ?? ''),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    name: String(raw.name ?? raw.Name ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    role: String(raw.role ?? raw.Role ?? ''),
  } satisfies LoginResponse
}

export type Part = {
  id: number
  name: string
  description: string
  price: number
  quantity: number
  createdAt: string
}

export type CreatePart = {
  name: string
  description: string
  price: number
  quantity: number
}

export type DashboardReport = {
  totalCustomers: number
  totalSales: number
  totalRevenue: number
  lowStockPartsCount: number
  pendingCreditsCount?: number
  pendingCreditsAmount?: number
  weeklyPurchaseItemsCount?: number
  weeklyCustomerInteractions?: number
  monthlyPurchaseCost?: number
}

export type DashboardAnalytics = {
  labels: string[]
  monthlyRevenue: number[]
  monthlySalesCount: number[]
  monthlyUnitsSold: number[]
  pendingCreditsCount: number
  pendingCreditsAmount: number
}

export async function getDashboardReport(token?: string) {
  return await request<DashboardReport>('/api/report/dashboard', { token: token ?? undefined })
}

export async function getParts(token?: string) {
  return await request<Part[]>('/api/parts', { token: token ?? undefined })
}

export async function addPart(token: string | undefined, part: CreatePart) {
  return await request<Part>('/api/parts', {
    method: 'POST',
    token: token ?? undefined,
    body: part,
  })
}

export async function updatePart(token: string | undefined, id: number, part: CreatePart) {
  return await request<Part>(`/api/parts/${id}`, {
    method: 'PUT',
    token: token ?? undefined,
    body: part,
  })
}

export async function deletePart(token: string | undefined, id: number) {
  return await request<{ message: string }>(`/api/parts/${id}`, {
    method: 'DELETE',
    token: token ?? undefined,
  })
}

export async function getDashboardAnalytics(token?: string) {
  return await request<DashboardAnalytics>('/api/report/analytics', { token: token ?? undefined })
}

export interface Vendor {
  id: number
  name: string
  email: string
  contact?: string
  address?: string
}

export interface CreateVendor {
  name: string
  email: string
  contact?: string
  address?: string
}

export async function getVendors(token?: string) {
  return await request<Vendor[]>('/api/vendor', { token: token ?? undefined })
}

export async function addVendor(token: string | undefined, vendor: CreateVendor) {
  return await request<Vendor>('/api/vendor', {
    method: 'POST',
    token: token ?? undefined,
    body: vendor,
  })
}

export interface Notification {
  id: number
  title: string
  message: string
  type: 'LowStock' | 'UnpaidCredit'
  referenceId: string
  isRead: boolean
  createdAt: string
}

export async function getNotifications(token?: string) {
  return await request<Notification[]>('/api/notifications', { token: token ?? undefined })
}

export async function markNotificationAsRead(token: string | undefined, id: number) {
  return await request<{ message: string }>(`/api/notifications/${id}/read`, {
    method: 'POST',
    token: token ?? undefined,
  })
}

export async function markAllNotificationsAsRead(token?: string) {
  return await request<{ message: string }>('/api/notifications/read-all', {
    method: 'POST',
    token: token ?? undefined,
  })
}

export interface Invoice {
  id: number
  invoiceNumber: string
  createdDate: string
  dueDate?: string
  isSent: boolean
  sentDate?: string
  isPaid: boolean
  paymentStatus?: string
  paidAmount?: number
  balanceAmount?: number
  reminderSentCount: number
  lastReminderDate?: string
  sale?: {
    id: number
    totalAmount: number
    discountAmount: number
    originalTotalAmount: number
    customer?: {
      id: number
      name: string
      email: string
      phone: string
      address: string
    }
  }
}

export async function getInvoices(token?: string) {
  return await request<Invoice[]>('/api/invoices', { token: token ?? undefined })
}

export async function markInvoiceAsPaid(token: string | undefined, id: number) {
  return await request<{ message: string }>(`/api/invoices/${id}/pay`, {
    method: 'POST',
    token: token ?? undefined,
  })
}

export async function recordInvoicePayment(token: string | undefined, id: number, amount: number) {
  return await request<{
    message: string
    paymentStatus: string
    paidAmount: number
    balanceAmount: number
    isPaid: boolean
  }>(`/api/invoices/${id}/payment`, { method: 'POST', token: token ?? undefined, body: { amount } })
}

export async function sendInvoiceReminder(token: string | undefined, id: number) {
  return await request<{ message: string }>(`/api/invoices/${id}/send-reminder`, {
    method: 'POST',
    token: token ?? undefined,
  })
}

/** @deprecated Prefer extractApiErrorMessage from lib/apiClient */
export { extractApiErrorMessage }
