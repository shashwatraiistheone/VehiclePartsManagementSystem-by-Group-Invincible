const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

function requireBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL. Add it to frontend/.env')
  }
  return API_BASE_URL
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

async function request<T>(
  path: string,
  opts: { method?: string; token?: string; body?: unknown } = {},
): Promise<T> {
  const baseUrl = requireBaseUrl()
  const method = opts.method ?? 'GET'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const d = data as Record<string, unknown> | null
    const message =
      (typeof d?.detail === 'string' && d.detail) ||
      (typeof d?.message === 'string' && d.message) ||
      (typeof d?.title === 'string' && d.title) ||
      'Request failed'
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
  return await request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
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

export async function getParts(token: string) {
  return await request<Part[]>('/api/parts', { token })
}

export async function addPart(token: string, part: CreatePart) {
  return await request<Part>('/api/parts', {
    method: 'POST',
    token,
    body: part,
  })
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  contact?: string;
  address?: string;
}

export interface CreateVendor {
  name: string;
  email: string;
  contact?: string;
  address?: string;
}

export async function getVendors(token: string) {
  return await request<Vendor[]>('/api/vendor', { token })
}

export async function addVendor(token: string, vendor: CreateVendor) {
  return await request<Vendor>('/api/vendor', {
    method: 'POST',
    token,
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

export async function getNotifications(token: string) {
  return await request<Notification[]>('/api/notifications', { token })
}

export async function markNotificationAsRead(token: string, id: number) {
  return await request<{ message: string }>(`/api/notifications/${id}/read`, {
    method: 'POST',
    token,
  })
}

export async function markAllNotificationsAsRead(token: string) {
  return await request<{ message: string }>('/api/notifications/read-all', {
    method: 'POST',
    token,
  })
}

export interface Invoice {
  id: number
  invoiceNumber: string
  createdDate: string
  isSent: boolean
  sentDate?: string
  isPaid: boolean
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

export async function getInvoices(token: string) {
  return await request<Invoice[]>('/api/invoices', { token })
}

export async function markInvoiceAsPaid(token: string, id: number) {
  return await request<{ message: string }>(`/api/invoices/${id}/pay`, {
    method: 'POST',
    token,
  })
}

export async function sendInvoiceReminder(token: string, id: number) {
  return await request<{ message: string }>(`/api/invoices/${id}/send-reminder`, {
    method: 'POST',
    token,
  })
}


