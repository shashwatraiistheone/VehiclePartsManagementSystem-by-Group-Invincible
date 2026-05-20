import axios from 'axios'
import { getAccountEmailFromToken, getStoredRole, getStoredUserName } from '../lib/auth'
import { api, extractApiErrorMessage } from '../lib/apiClient'
import { fetchAppointments } from './appointmentApi'
import { fetchCustomers } from './customerApi'
import { fetchCreditInvoices } from './creditApi'
import { fetchAllPartRequests } from './partRequestApi'
import { fetchSales } from './salesApi'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

/** Simple home/landing page payload */
export type StaffHomeData = {
  username: string
  account: string
  role: string
  totalCustomers: number
  appointmentsToday: number
  salesToday: number
  pendingPartRequests: number
  systemOnline: boolean
}

export type StaffWorkspaceAppointment = {
  id: number
  customerName: string
  serviceType: string
  status: string
  date: string
  vehicleNumber?: string | null
}

export type StaffWorkspacePartRequest = {
  id: number
  customerName: string
  partName: string
  quantity: number
  status: string
  createdAt: string
}

export type StaffWorkspaceOverduePayment = {
  invoiceId: number
  invoiceNumber: string
  customerName: string
  balanceAmount: number
  dueDate: string
  overdueDays: number
}

export type StaffWorkspaceSale = {
  id: number
  customerName: string
  finalAmount: number
  date: string
  invoiceNumber: string
  paymentStatus: string
}

/** Advanced staff dashboard / operations workspace */
export type StaffWorkspaceData = {
  username: string
  account: string
  salesTodayRevenue: number
  salesTodayCount: number
  salesWeekCount: number
  salesWeekRevenue: number
  customersServicedWeek: number
  revenueThisMonth: number
  customersServicedMonth: number
  pendingAppointmentsCount: number
  pendingPartRequestsCount: number
  overduePaymentsCount: number
  overduePaymentsAmount: number
  todayConfirmedAppointments: StaffWorkspaceAppointment[]
  pendingPartRequests: StaffWorkspacePartRequest[]
  overduePayments: StaffWorkspaceOverduePayment[]
  recentSales: StaffWorkspaceSale[]
}

function isUtcToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  )
}

function mapStaffHomePayload(raw: Record<string, unknown>): StaffHomeData {
  return {
    username: String(raw.username ?? raw.Username ?? 'Staff'),
    account: String(raw.account ?? raw.Account ?? 'staff'),
    role: String(raw.role ?? raw.Role ?? 'STAFF MEMBER'),
    totalCustomers: Number(raw.totalCustomers ?? raw.TotalCustomers ?? 0),
    appointmentsToday: Number(raw.appointmentsToday ?? raw.AppointmentsToday ?? 0),
    salesToday: Number(raw.salesToday ?? raw.SalesToday ?? 0),
    pendingPartRequests: Number(raw.pendingPartRequests ?? raw.PendingPartRequests ?? 0),
    systemOnline: Boolean(raw.systemOnline ?? raw.SystemOnline ?? true),
  }
}

async function fetchStaffHomeAggregated(): Promise<StaffHomeData> {
  const [customers, appointments, sales, partRequests] = await Promise.all([
    fetchCustomers().catch(() => []),
    fetchAppointments().catch(() => ({ summary: { pending: 0, confirmed: 0, cancelled: 0, completed: 0 }, items: [] })),
    fetchSales().catch(() => []),
    fetchAllPartRequests().catch(() => []),
  ])

  const email = getAccountEmailFromToken()
  const username = getStoredUserName()?.trim() || email?.split('@')[0] || 'Staff'
  const account = email?.split('@')[0] || username
  const roleLabel = getStoredRole() === 'Admin' ? 'ADMIN' : 'STAFF MEMBER'

  return {
    username,
    account,
    role: roleLabel,
    totalCustomers: customers.length,
    appointmentsToday: appointments.items.filter((a) => isUtcToday(a.date)).length,
    salesToday: sales.filter((s) => isUtcToday(s.date)).length,
    pendingPartRequests: partRequests.filter((p) => p.status.toLowerCase() === 'pending').length,
    systemOnline: true,
  }
}

async function tryStaffHomeEndpoint(path: string): Promise<StaffHomeData | null> {
  try {
    const { data } = await api.get<Record<string, unknown>>(path)
    return mapStaffHomePayload(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function fetchStaffHome(): Promise<StaffHomeData> {
  const paths = ['/api/report/staff-dashboard', '/api/staff/home']
  for (const path of paths) {
    const data = await tryStaffHomeEndpoint(path)
    if (data) return data
  }
  try {
    return await fetchStaffHomeAggregated()
  } catch (error) {
    throw new Error(extractError(error))
  }
}

/** @deprecated Use fetchStaffHome */
export const fetchStaffDashboard = fetchStaffHome

function utcTodayStart(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function utcWeekStart(): Date {
  const start = utcTodayStart()
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  return start
}

function utcMonthStart(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function parseUtc(iso: string): Date {
  return new Date(iso)
}

function isInRange(d: Date, start: Date, end?: Date): boolean {
  if (d < start) return false
  if (end && d >= end) return false
  return true
}

function mapStaffWorkspacePayload(raw: Record<string, unknown>): StaffWorkspaceData {
  const list = <T>(key: string, mapper: (r: Record<string, unknown>) => T): T[] => {
    const src = raw[key] ?? raw[key.charAt(0).toUpperCase() + key.slice(1)]
    if (!Array.isArray(src)) return []
    return src.map((row) => mapper(row as Record<string, unknown>))
  }

  return {
    username: String(raw.username ?? raw.Username ?? 'Staff'),
    account: String(raw.account ?? raw.Account ?? 'staff'),
    salesTodayRevenue: Number(raw.salesTodayRevenue ?? raw.SalesTodayRevenue ?? 0),
    salesTodayCount: Number(raw.salesTodayCount ?? raw.SalesTodayCount ?? 0),
    salesWeekCount: Number(raw.salesWeekCount ?? raw.SalesWeekCount ?? 0),
    salesWeekRevenue: Number(raw.salesWeekRevenue ?? raw.SalesWeekRevenue ?? 0),
    customersServicedWeek: Number(raw.customersServicedWeek ?? raw.CustomersServicedWeek ?? 0),
    revenueThisMonth: Number(raw.revenueThisMonth ?? raw.RevenueThisMonth ?? 0),
    customersServicedMonth: Number(raw.customersServicedMonth ?? raw.CustomersServicedMonth ?? 0),
    pendingAppointmentsCount: Number(raw.pendingAppointmentsCount ?? raw.PendingAppointmentsCount ?? 0),
    pendingPartRequestsCount: Number(raw.pendingPartRequestsCount ?? raw.PendingPartRequestsCount ?? 0),
    overduePaymentsCount: Number(raw.overduePaymentsCount ?? raw.OverduePaymentsCount ?? 0),
    overduePaymentsAmount: Number(raw.overduePaymentsAmount ?? raw.OverduePaymentsAmount ?? 0),
    todayConfirmedAppointments: list('todayConfirmedAppointments', (r) => ({
      id: Number(r.id ?? r.Id ?? 0),
      customerName: String(r.customerName ?? r.CustomerName ?? ''),
      serviceType: String(r.serviceType ?? r.ServiceType ?? ''),
      status: String(r.status ?? r.Status ?? ''),
      date: String(r.date ?? r.Date ?? ''),
      vehicleNumber: (r.vehicleNumber ?? r.VehicleNumber) as string | null | undefined,
    })),
    pendingPartRequests: list('pendingPartRequests', (r) => ({
      id: Number(r.id ?? r.Id ?? 0),
      customerName: String(r.customerName ?? r.CustomerName ?? ''),
      partName: String(r.partName ?? r.PartName ?? ''),
      quantity: Number(r.quantity ?? r.Quantity ?? 1),
      status: String(r.status ?? r.Status ?? ''),
      createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    })),
    overduePayments: list('overduePayments', (r) => ({
      invoiceId: Number(r.invoiceId ?? r.InvoiceId ?? 0),
      invoiceNumber: String(r.invoiceNumber ?? r.InvoiceNumber ?? ''),
      customerName: String(r.customerName ?? r.CustomerName ?? ''),
      balanceAmount: Number(r.balanceAmount ?? r.BalanceAmount ?? 0),
      dueDate: String(r.dueDate ?? r.DueDate ?? ''),
      overdueDays: Number(r.overdueDays ?? r.OverdueDays ?? 0),
    })),
    recentSales: list('recentSales', (r) => ({
      id: Number(r.id ?? r.Id ?? 0),
      customerName: String(r.customerName ?? r.CustomerName ?? ''),
      finalAmount: Number(r.finalAmount ?? r.FinalAmount ?? 0),
      date: String(r.date ?? r.Date ?? ''),
      invoiceNumber: String(r.invoiceNumber ?? r.InvoiceNumber ?? ''),
      paymentStatus: String(r.paymentStatus ?? r.PaymentStatus ?? 'CREDIT'),
    })),
  }
}

async function fetchStaffWorkspaceAggregated(): Promise<StaffWorkspaceData> {
  const todayStart = utcTodayStart()
  const todayEnd = new Date(todayStart)
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1)
  const weekStart = utcWeekStart()
  const monthStart = utcMonthStart()

  const [sales, appointmentsRes, partRequests, credit] = await Promise.all([
    fetchSales().catch(() => []),
    fetchAppointments().catch(() => ({
      summary: { pending: 0, confirmed: 0, cancelled: 0, completed: 0 },
      items: [],
    })),
    fetchAllPartRequests().catch(() => []),
    fetchCreditInvoices().catch(() => ({ totalReceivables: 0, items: [] })),
  ])

  const appointments = appointmentsRes.items
  const email = getAccountEmailFromToken()
  const username = getStoredUserName()?.trim() || email?.split('@')[0] || 'Staff'
  const account = email?.split('@')[0] || username

  const salesToday = sales.filter((s) => isInRange(parseUtc(s.date), todayStart, todayEnd))
  const salesWeek = sales.filter((s) => parseUtc(s.date) >= weekStart)
  const salesMonth = sales.filter((s) => parseUtc(s.date) >= monthStart)

  const pendingAppointments = appointments.filter((a) => {
    const d = parseUtc(a.date)
    return a.status.toLowerCase() === 'scheduled' && d >= todayStart
  })

  const todayConfirmed = appointments
    .filter((a) => {
      const d = parseUtc(a.date)
      const s = a.status.toLowerCase()
      return (
        isInRange(d, todayStart, todayEnd) &&
        s !== 'cancelled' &&
        s !== 'rejected'
      )
    })
    .sort((a, b) => parseUtc(a.date).getTime() - parseUtc(b.date).getTime())
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      customerName: a.customerName,
      serviceType: a.serviceType,
      status: a.status,
      date: a.date,
      vehicleNumber: a.vehicleNumber,
    }))

  const weekCustomerIds = new Set<number>([
    ...salesWeek.map((s) => s.customerId),
    ...appointments
      .filter((a) => parseUtc(a.date) >= weekStart)
      .map((a) => a.customerId),
  ])
  const monthCustomerIds = new Set<number>([
    ...salesMonth.map((s) => s.customerId),
    ...appointments
      .filter((a) => parseUtc(a.date) >= monthStart)
      .map((a) => a.customerId),
  ])

  const pendingParts = partRequests.filter((p) => p.status.toLowerCase() === 'pending')
  const pendingPartsList = [...pendingParts]
    .sort((a, b) => parseUtc(b.createdAt).getTime() - parseUtc(a.createdAt).getTime())
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      customerName: r.customerName,
      partName: r.partName,
      quantity: r.quantity ?? 1,
      status: r.status,
      createdAt: r.createdAt,
    }))

  const overdueItems = credit.items.filter((inv) => {
    if (inv.balanceDue <= 0 || inv.status.toLowerCase() === 'paid') return false
    const due = parseUtc(inv.dueDate || inv.invoiceDate)
    return due < todayStart
  })

  const overduePayments = [...overdueItems]
    .sort((a, b) => parseUtc(a.dueDate).getTime() - parseUtc(b.dueDate).getTime())
    .slice(0, 10)
    .map((inv) => {
      const due = parseUtc(inv.dueDate || inv.invoiceDate)
      const overdueDays = Math.max(
        0,
        Math.floor((todayStart.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)),
      )
      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        balanceAmount: inv.balanceDue,
        dueDate: inv.dueDate || inv.invoiceDate,
        overdueDays,
      }
    })

  const recentSales = [...sales]
    .sort((a, b) => parseUtc(b.date).getTime() - parseUtc(a.date).getTime())
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      customerName: s.customerName,
      finalAmount: s.finalAmount,
      date: s.date,
      invoiceNumber: s.invoiceNumber || `SALE-${s.id}`,
      paymentStatus: (s.invoice?.paymentStatus ?? 'Credit').toUpperCase(),
    }))

  return {
    username,
    account,
    salesTodayRevenue: salesToday.reduce((sum, s) => sum + s.finalAmount, 0),
    salesTodayCount: salesToday.length,
    salesWeekCount: salesWeek.length,
    salesWeekRevenue: salesWeek.reduce((sum, s) => sum + s.finalAmount, 0),
    customersServicedWeek: weekCustomerIds.size,
    revenueThisMonth: salesMonth.reduce((sum, s) => sum + s.finalAmount, 0),
    customersServicedMonth: monthCustomerIds.size,
    pendingAppointmentsCount: pendingAppointments.length,
    pendingPartRequestsCount: pendingParts.length,
    overduePaymentsCount: overdueItems.length,
    overduePaymentsAmount: overdueItems.reduce((sum, inv) => sum + inv.balanceDue, 0),
    todayConfirmedAppointments: todayConfirmed,
    pendingPartRequests: pendingPartsList,
    overduePayments,
    recentSales,
  }
}

async function tryStaffWorkspaceEndpoint(path: string): Promise<StaffWorkspaceData | null> {
  try {
    const { data } = await api.get<Record<string, unknown>>(path)
    return mapStaffWorkspacePayload(data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function fetchStaffWorkspace(): Promise<StaffWorkspaceData> {
  const paths = ['/api/report/staff-workspace', '/api/staff/workspace']
  for (const path of paths) {
    const data = await tryStaffWorkspaceEndpoint(path)
    if (data) return data
  }
  try {
    return await fetchStaffWorkspaceAggregated()
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function changeStaffPassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  try {
    await api.post('/api/auth/change-password', { currentPassword, newPassword })
  } catch (error) {
    throw new Error(extractError(error))
  }
}
