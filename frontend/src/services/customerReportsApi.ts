import axios from 'axios'
import { api, extractApiErrorMessage } from '../lib/apiClient'
import { fetchCreditInvoices, type CreditInvoice } from './creditApi'
import { fetchCustomers } from './customerApi'
import { fetchSales, type SaleRecord } from './salesApi'

const LOYALTY_ORDER_THRESHOLD = 5000

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

function isAxiosNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

function parseDateStart(iso: string): Date {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDateEndExclusive(iso: string): Date {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return d
}

function reportHasDateRange(params?: ReportDateParams): boolean {
  return Boolean(params?.from ?? params?.fromDate ?? params?.to ?? params?.toDate)
}

function filterSalesByReportRange(sales: SaleRecord[], params?: ReportDateParams): SaleRecord[] {
  const fromStr = params?.fromDate ?? params?.from
  const toStr = params?.toDate ?? params?.to
  if (!fromStr && !toStr) return sales

  const from = fromStr ? parseDateStart(fromStr) : null
  const toExclusive = toStr ? parseDateEndExclusive(toStr) : null

  return sales.filter((sale) => {
    const d = new Date(sale.date)
    if (from && d < from) return false
    if (toExclusive && d >= toExclusive) return false
    return true
  })
}

function filterInvoicesByReportRange(invoices: CreditInvoice[], params?: ReportDateParams): CreditInvoice[] {
  const fromStr = params?.fromDate ?? params?.from
  const toStr = params?.toDate ?? params?.to
  if (!fromStr && !toStr) return invoices

  const from = fromStr ? parseDateStart(fromStr) : null
  const toExclusive = toStr ? parseDateEndExclusive(toStr) : null

  return invoices.filter((inv) => {
    const d = new Date(inv.invoiceDate)
    if (from && d < from) return false
    if (toExclusive && d >= toExclusive) return false
    return true
  })
}

function matchesSearchTerm(
  term: string,
  fields: (string | null | undefined)[],
): boolean {
  const q = term.toLowerCase()
  return fields.some((f) => f && f.toLowerCase().includes(q))
}

function resolveTier(isEligible: boolean, qualifyingOrderCount: number, largestSubtotal: number): string {
  const progressPercent =
    largestSubtotal > 0
      ? Math.min(100, Math.round((largestSubtotal / LOYALTY_ORDER_THRESHOLD) * 100))
      : 0
  if (isEligible && qualifyingOrderCount >= 2) return 'GOLD PLUS'
  if (isEligible) return 'GOLD'
  if (progressPercent >= 50) return 'SILVER'
  return 'MEMBER'
}

function computeLoyaltyPoints(totalSpent: number, qualifyingOrderCount: number): number {
  return Math.round(totalSpent * 0.2184) + qualifyingOrderCount * 200
}

function resolveEngagementLevel(purchaseCount: number, monthlyVisits: number): string {
  if (purchaseCount >= 5 || monthlyVisits >= 3) return 'Frequent'
  if (purchaseCount >= 3 || monthlyVisits >= 2) return 'Regular'
  if (purchaseCount >= 2 && monthlyVisits >= 1) return 'Occasional'
  return 'New'
}

function resolveEngagementScore(
  purchaseCount: number,
  monthlyVisits: number,
  tier: string,
  progressPercent: number,
): number {
  let score = purchaseCount * 10 + monthlyVisits * 15
  if (tier === 'GOLD PLUS') score += 40
  else if (tier === 'GOLD') score += 30
  else if (tier === 'SILVER') score += 15
  score += Math.round(progressPercent / 10)
  return Math.min(100, score)
}

function resolveAgingBucket(daysOutstanding: number): string {
  if (daysOutstanding <= 30) return 'current'
  if (daysOutstanding <= 60) return 'warning'
  return 'overdue'
}

type CustomerSaleAgg = {
  customerId: number
  customerName: string
  email: string
  phone: string
  purchaseCount: number
  totalSpent: number
  lastPurchaseDate: string | null
  monthlyVisits: number
  qualifyingOrders: number
  hasDiscount: boolean
  largestSubtotal: number
}

function aggregateSalesByCustomer(sales: SaleRecord[]): Map<number, CustomerSaleAgg> {
  const monthStart = new Date()
  monthStart.setDate(monthStart.getDate() - 30)
  const map = new Map<number, CustomerSaleAgg>()

  for (const sale of sales) {
    const subtotal = sale.totalAmount
    const existing = map.get(sale.customerId)
    const saleDate = new Date(sale.date)
    const isMonthly = saleDate >= monthStart
    const isQualifying = subtotal >= LOYALTY_ORDER_THRESHOLD
    const hasDiscount = sale.discount > 0

    if (!existing) {
      map.set(sale.customerId, {
        customerId: sale.customerId,
        customerName: sale.customerName,
        email: sale.customerEmail ?? '',
        phone: sale.customerPhone ?? '',
        purchaseCount: 1,
        totalSpent: sale.finalAmount,
        lastPurchaseDate: sale.date,
        monthlyVisits: isMonthly ? 1 : 0,
        qualifyingOrders: isQualifying ? 1 : 0,
        hasDiscount,
        largestSubtotal: subtotal,
      })
      continue
    }

    existing.purchaseCount += 1
    existing.totalSpent += sale.finalAmount
    if (isMonthly) existing.monthlyVisits += 1
    if (isQualifying) existing.qualifyingOrders += 1
    if (hasDiscount) existing.hasDiscount = true
    if (subtotal > existing.largestSubtotal) existing.largestSubtotal = subtotal
    if (!existing.lastPurchaseDate || sale.date > existing.lastPurchaseDate) {
      existing.lastPurchaseDate = sale.date
    }
    if (!existing.email && sale.customerEmail) existing.email = sale.customerEmail
    if (!existing.phone && sale.customerPhone) existing.phone = sale.customerPhone
  }

  return map
}

function mapLegacyRow(raw: Record<string, unknown>) {
  return {
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    name: String(raw.name ?? raw.Name ?? ''),
    phone: String(raw.phone ?? raw.Phone ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    purchaseCount: Number(raw.purchaseCount ?? raw.PurchaseCount ?? 0),
    totalSpent: Number(raw.totalSpent ?? raw.TotalSpent ?? 0),
    pendingCreditAmount: Number(raw.pendingCreditAmount ?? raw.PendingCreditAmount ?? 0),
  }
}

async function fetchLegacyCustomerReports(): Promise<{
  highSpenders: ReturnType<typeof mapLegacyRow>[]
  regularCustomers: ReturnType<typeof mapLegacyRow>[]
  pendingCreditCustomers: ReturnType<typeof mapLegacyRow>[]
} | null> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/api/customer/reports')
    const highRaw = (data.highSpenders ?? data.HighSpenders ?? []) as unknown[]
    const regularRaw = (data.regularCustomers ?? data.RegularCustomers ?? []) as unknown[]
    const pendingRaw = (data.pendingCreditCustomers ?? data.PendingCreditCustomers ?? []) as unknown[]
    return {
      highSpenders: highRaw.map((row) => mapLegacyRow(row as Record<string, unknown>)),
      regularCustomers: regularRaw.map((row) => mapLegacyRow(row as Record<string, unknown>)),
      pendingCreditCustomers: pendingRaw.map((row) => mapLegacyRow(row as Record<string, unknown>)),
    }
  } catch (e) {
    if (isAxiosNotFound(e)) return null
    throw e
  }
}

async function fetchDashboardAggregated(params?: ReportDateParams): Promise<CustomerReportsDashboard> {
  const [customers, salesAll, credit] = await Promise.all([
    fetchCustomers().catch(() => []),
    fetchSales().catch(() => []),
    fetchCreditInvoices().catch(() => ({ totalReceivables: 0, items: [] })),
  ])

  const sales = filterSalesByReportRange(salesAll, params)
  const unpaid = filterInvoicesByReportRange(
    credit.items.filter((inv) => inv.balanceDue > 0 && inv.status.toLowerCase() !== 'paid'),
    params,
  )
  const hasRange = reportHasDateRange(params)

  return {
    totalCustomers: hasRange ? new Set(sales.map((s) => s.customerId)).size : customers.length,
    totalRevenue: sales.reduce((sum, s) => sum + s.finalAmount, 0),
    pendingCredit: unpaid.reduce((sum, inv) => sum + inv.balanceDue, 0),
    totalSales: sales.length,
  }
}

function buildTopSpendersFromAgg(
  agg: Map<number, CustomerSaleAgg>,
  search?: string,
): TopSpenderRow[] {
  const term = search?.trim().toLowerCase()
  let rows = [...agg.values()]
    .filter((a) => a.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 100)
    .map((a) => {
      const isEligible = a.qualifyingOrders > 0 || a.hasDiscount
      return {
        customerId: a.customerId,
        customerName: a.customerName,
        email: a.email,
        phone: a.phone,
        totalSpent: a.totalSpent,
        loyaltyPoints: computeLoyaltyPoints(a.totalSpent, a.qualifyingOrders),
        purchaseCount: a.purchaseCount,
        lastPurchaseDate: a.lastPurchaseDate,
        loyaltyTier: resolveTier(isEligible, a.qualifyingOrders, a.largestSubtotal),
      }
    })

  if (term) {
    rows = rows.filter((r) =>
      matchesSearchTerm(term, [r.customerName, r.email, r.phone, String(r.customerId)]),
    )
  }
  return rows
}

function buildRegularCustomersFromAgg(
  agg: Map<number, CustomerSaleAgg>,
  search?: string,
): RegularCustomerRow[] {
  const term = search?.trim().toLowerCase()
  let rows = [...agg.values()]
    .filter((a) => a.purchaseCount >= 2 || a.monthlyVisits >= 2)
    .map((a) => {
      const isEligible = a.qualifyingOrders > 0 || a.hasDiscount
      const tier = resolveTier(isEligible, a.qualifyingOrders, a.largestSubtotal)
      const progressPercent =
        a.largestSubtotal > 0
          ? Math.min(100, Math.round((a.largestSubtotal / LOYALTY_ORDER_THRESHOLD) * 100))
          : 0
      const avgValue = a.purchaseCount > 0 ? a.totalSpent / a.purchaseCount : 0
      return {
        customerId: a.customerId,
        customerName: a.customerName,
        email: a.email,
        purchaseCount: a.purchaseCount,
        monthlyVisits: a.monthlyVisits,
        averageOrderValue: avgValue,
        engagementLevel: resolveEngagementLevel(a.purchaseCount, a.monthlyVisits),
        loyaltyTier: tier,
        engagementScore: resolveEngagementScore(a.purchaseCount, a.monthlyVisits, tier, progressPercent),
        totalSpent: a.totalSpent,
      }
    })
    .sort((a, b) => b.engagementScore - a.engagementScore || b.purchaseCount - a.purchaseCount)
    .slice(0, 100)

  if (term) {
    rows = rows.filter((r) => matchesSearchTerm(term, [r.customerName, r.email]))
  }
  return rows
}

function mapCreditInvoiceToPending(inv: CreditInvoice): PendingCreditRow {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const salesDate = new Date(inv.invoiceDate)
  const daysOutstanding = Math.max(
    0,
    Math.floor((today.getTime() - salesDate.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const due = new Date(inv.dueDate || inv.invoiceDate)
  const overdueDays =
    inv.overdueDays > 0
      ? inv.overdueDays
      : Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

  return {
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerId: inv.customerId,
    customerName: inv.customerName,
    customerEmail: inv.customerEmail,
    customerPhone: '',
    outstandingAmount: inv.balanceDue,
    originalAmount: inv.originalAmount,
    paidAmount: inv.paidAmount,
    daysOutstanding,
    overdueDays,
    agingBucket: resolveAgingBucket(daysOutstanding),
    dueDate: inv.dueDate,
    salesDate: inv.invoiceDate,
    invoiceDate: inv.invoiceDate,
    status: inv.status,
  }
}

async function fetchPendingCreditsAggregated(params?: ReportDateParams): Promise<PendingCreditsReport> {
  const credit = await fetchCreditInvoices().catch(() => ({ totalReceivables: 0, items: [] }))
  const term = params?.search?.trim().toLowerCase()
  const bucketFilter = params?.overdueStatus?.trim().toLowerCase()

  let items = filterInvoicesByReportRange(
    credit.items.filter((inv) => inv.balanceDue > 0 && inv.status.toLowerCase() !== 'paid'),
    params,
  ).map(mapCreditInvoiceToPending)

  if (term) {
    items = items.filter((r) =>
      matchesSearchTerm(term, [
        r.customerName,
        r.customerEmail,
        r.customerPhone,
        r.invoiceNumber,
      ]),
    )
  }

  if (bucketFilter && bucketFilter !== 'all') {
    items = items.filter((r) => r.agingBucket === bucketFilter)
  }

  items.sort((a, b) => b.outstandingAmount - a.outstandingAmount)

  return {
    outstandingTotal: items.reduce((sum, r) => sum + r.outstandingAmount, 0),
    items,
  }
}

function legacyRowToTopSpender(row: ReturnType<typeof mapLegacyRow>): TopSpenderRow {
  const qualifyingOrders = row.purchaseCount >= 2 ? 1 : 0
  const isEligible = row.totalSpent >= LOYALTY_ORDER_THRESHOLD
  return {
    customerId: row.customerId,
    customerName: row.name,
    email: row.email,
    phone: row.phone,
    totalSpent: row.totalSpent,
    loyaltyPoints: computeLoyaltyPoints(row.totalSpent, qualifyingOrders),
    purchaseCount: row.purchaseCount,
    lastPurchaseDate: null,
    loyaltyTier: resolveTier(isEligible, qualifyingOrders, row.totalSpent),
  }
}

function legacyRowToRegular(row: ReturnType<typeof mapLegacyRow>): RegularCustomerRow {
  const qualifyingOrders = row.purchaseCount >= 2 ? 1 : 0
  const isEligible = row.totalSpent >= LOYALTY_ORDER_THRESHOLD
  const tier = resolveTier(isEligible, qualifyingOrders, row.totalSpent)
  const progressPercent = Math.min(100, Math.round((row.totalSpent / LOYALTY_ORDER_THRESHOLD) * 100))
  const avgValue = row.purchaseCount > 0 ? row.totalSpent / row.purchaseCount : 0
  return {
    customerId: row.customerId,
    customerName: row.name,
    email: row.email,
    purchaseCount: row.purchaseCount,
    monthlyVisits: Math.min(row.purchaseCount, 4),
    averageOrderValue: avgValue,
    engagementLevel: resolveEngagementLevel(row.purchaseCount, Math.min(row.purchaseCount, 4)),
    loyaltyTier: tier,
    engagementScore: resolveEngagementScore(
      row.purchaseCount,
      Math.min(row.purchaseCount, 4),
      tier,
      progressPercent,
    ),
    totalSpent: row.totalSpent,
  }
}

export type CustomerReportsDashboard = {
  totalCustomers: number
  totalRevenue: number
  pendingCredit: number
  totalSales: number
}

export type TopSpenderRow = {
  customerId: number
  customerName: string
  email: string
  phone: string
  totalSpent: number
  loyaltyPoints: number
  purchaseCount: number
  lastPurchaseDate: string | null
  loyaltyTier: string
}

export type RegularCustomerRow = {
  customerId: number
  customerName: string
  email: string
  purchaseCount: number
  monthlyVisits: number
  averageOrderValue: number
  engagementLevel: string
  loyaltyTier: string
  engagementScore: number
  totalSpent: number
}

export type PendingCreditRow = {
  invoiceId: number
  invoiceNumber: string
  customerId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  outstandingAmount: number
  originalAmount: number
  paidAmount: number
  daysOutstanding: number
  overdueDays: number
  agingBucket: string
  dueDate: string
  salesDate: string
  invoiceDate: string
  status: string
}

export type PendingCreditsReport = {
  outstandingTotal: number
  items: PendingCreditRow[]
}

export type ReportDateParams = {
  from?: string
  to?: string
  fromDate?: string
  toDate?: string
  search?: string
  overdueStatus?: string
}

function buildReportDateParams(params?: ReportDateParams) {
  if (!params) return undefined
  const fromDate = params.fromDate ?? params.from
  const toDate = params.toDate ?? params.to
  return {
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
    ...(params.search ? { search: params.search } : {}),
    ...(params.overdueStatus ? { overdueStatus: params.overdueStatus } : {}),
  }
}

/** @deprecated Use buildReportDateParams */
const buildTopSpendersQueryParams = buildReportDateParams

function mapDashboard(raw: Record<string, unknown>): CustomerReportsDashboard {
  return {
    totalCustomers: Number(raw.totalCustomers ?? raw.TotalCustomers ?? 0),
    totalRevenue: Number(raw.totalRevenue ?? raw.TotalRevenue ?? 0),
    pendingCredit: Number(raw.pendingCredit ?? raw.PendingCredit ?? 0),
    totalSales: Number(raw.totalSales ?? raw.TotalSales ?? 0),
  }
}

function mapTopSpender(raw: Record<string, unknown>): TopSpenderRow {
  return {
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    phone: String(raw.phone ?? raw.Phone ?? ''),
    totalSpent: Number(raw.totalSpent ?? raw.TotalSpent ?? 0),
    loyaltyPoints: Number(raw.loyaltyPoints ?? raw.LoyaltyPoints ?? 0),
    purchaseCount: Number(raw.purchaseCount ?? raw.PurchaseCount ?? 0),
    lastPurchaseDate: (raw.lastPurchaseDate ?? raw.LastPurchaseDate ?? null) as string | null,
    loyaltyTier: String(raw.loyaltyTier ?? raw.LoyaltyTier ?? ''),
  }
}

function mapRegular(raw: Record<string, unknown>): RegularCustomerRow {
  return {
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    purchaseCount: Number(raw.purchaseCount ?? raw.PurchaseCount ?? 0),
    monthlyVisits: Number(raw.monthlyVisits ?? raw.MonthlyVisits ?? 0),
    averageOrderValue: Number(raw.averageOrderValue ?? raw.AverageOrderValue ?? 0),
    engagementLevel: String(raw.engagementLevel ?? raw.EngagementLevel ?? ''),
    loyaltyTier: String(raw.loyaltyTier ?? raw.LoyaltyTier ?? ''),
    engagementScore: Number(raw.engagementScore ?? raw.EngagementScore ?? 0),
    totalSpent: Number(raw.totalSpent ?? raw.TotalSpent ?? 0),
  }
}

function mapPending(raw: Record<string, unknown>): PendingCreditRow {
  return {
    invoiceId: Number(raw.invoiceId ?? raw.InvoiceId ?? 0),
    invoiceNumber: String(raw.invoiceNumber ?? raw.InvoiceNumber ?? ''),
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    customerEmail: String(raw.customerEmail ?? raw.CustomerEmail ?? ''),
    customerPhone: String(raw.customerPhone ?? raw.CustomerPhone ?? ''),
    outstandingAmount: Number(raw.outstandingAmount ?? raw.OutstandingAmount ?? 0),
    originalAmount: Number(raw.originalAmount ?? raw.OriginalAmount ?? 0),
    paidAmount: Number(raw.paidAmount ?? raw.PaidAmount ?? 0),
    daysOutstanding: Number(raw.daysOutstanding ?? raw.DaysOutstanding ?? raw.overdueDays ?? 0),
    overdueDays: Number(raw.overdueDays ?? raw.OverdueDays ?? 0),
    agingBucket: String(raw.agingBucket ?? raw.AgingBucket ?? 'current'),
    dueDate: String(raw.dueDate ?? raw.DueDate ?? ''),
    salesDate: String(raw.salesDate ?? raw.SalesDate ?? raw.invoiceDate ?? ''),
    invoiceDate: String(raw.invoiceDate ?? raw.InvoiceDate ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
  }
}

export async function fetchCustomerReportsDashboard(
  params?: ReportDateParams,
): Promise<CustomerReportsDashboard> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/api/reports/dashboard', { params })
    return mapDashboard(data)
  } catch (e) {
    if (!isAxiosNotFound(e)) throw new Error(extractError(e))
    return fetchDashboardAggregated(params)
  }
}

export async function fetchTopSpendersReport(params?: ReportDateParams): Promise<TopSpenderRow[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/reports/top-spenders', {
      params: buildTopSpendersQueryParams(params),
    })
    return data.map((row) => mapTopSpender(row))
  } catch (e) {
    if (!isAxiosNotFound(e)) throw new Error(extractError(e))

    const legacy = await fetchLegacyCustomerReports()
    if (legacy?.highSpenders.length) {
      let rows = legacy.highSpenders.map(legacyRowToTopSpender)
      const term = params?.search?.trim().toLowerCase()
      if (term) {
        rows = rows.filter((r) =>
          matchesSearchTerm(term, [r.customerName, r.email, r.phone, String(r.customerId)]),
        )
      }
      return rows
    }

    const sales = filterSalesByReportRange(await fetchSales().catch(() => []), params)
    return buildTopSpendersFromAgg(aggregateSalesByCustomer(sales), params?.search)
  }
}

export type TopSpendersExportFormat = 'csv' | 'excel' | 'pdf'

function exportExtension(format: TopSpendersExportFormat): string {
  if (format === 'excel') return 'xlsx'
  return format
}

function exportMimeType(format: TopSpendersExportFormat): string {
  if (format === 'csv') return 'text/csv'
  if (format === 'excel') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return 'application/pdf'
}

function exportFileName(format: TopSpendersExportFormat): string {
  const date = new Date().toISOString().slice(0, 10)
  return `top-spenders-report-${date}.${exportExtension(format)}`
}

/** Download top spenders export from backend (respects active date filters). */
export async function downloadTopSpendersExport(
  format: TopSpendersExportFormat,
  params?: ReportDateParams,
): Promise<{ fileName: string; blob: Blob }> {
  try {
    const path =
      format === 'csv'
        ? '/api/reports/top-spenders/export/csv'
        : format === 'excel'
          ? '/api/reports/top-spenders/export/excel'
          : '/api/reports/top-spenders/export/pdf'

    const response = await api.get<Blob>(path, {
      params: buildTopSpendersQueryParams(params),
      responseType: 'blob',
    })

    const disposition = response.headers['content-disposition'] as string | undefined
    let fileName = exportFileName(format)
    if (disposition) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
      if (match?.[1]) {
        fileName = match[1].replace(/['"]/g, '')
      }
    }

    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: exportMimeType(format) })

    return { fileName, blob }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message) throw new Error(parsed.message)
      } catch {
        /* use default */
      }
    }
    throw new Error(extractError(e))
  }
}

export async function fetchRegularCustomersReport(
  params?: ReportDateParams,
): Promise<RegularCustomerRow[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/reports/regular-customers', {
      params: buildReportDateParams(params),
    })
    return data.map((row) => mapRegular(row))
  } catch (e) {
    if (!isAxiosNotFound(e)) throw new Error(extractError(e))

    const legacy = await fetchLegacyCustomerReports()
    if (legacy?.regularCustomers.length) {
      let rows = legacy.regularCustomers.map(legacyRowToRegular)
      const term = params?.search?.trim().toLowerCase()
      if (term) {
        rows = rows.filter((r) => matchesSearchTerm(term, [r.customerName, r.email]))
      }
      return rows
    }

    const sales = filterSalesByReportRange(await fetchSales().catch(() => []), params)
    return buildRegularCustomersFromAgg(aggregateSalesByCustomer(sales), params?.search)
  }
}

export async function downloadRegularCustomersPdf(
  params?: ReportDateParams,
): Promise<{ fileName: string; blob: Blob }> {
  try {
    const response = await api.get<Blob>('/api/reports/regular-customers/export/pdf', {
      params: buildReportDateParams(params),
      responseType: 'blob',
    })

    const disposition = response.headers['content-disposition'] as string | undefined
    let fileName = `regular-customers-report-${new Date().toISOString().slice(0, 10)}.pdf`
    if (disposition) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
      if (match?.[1]) {
        fileName = match[1].replace(/['"]/g, '')
      }
    }

    const blob =
      response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })

    return { fileName, blob }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message) throw new Error(parsed.message)
      } catch {
        /* use default */
      }
    }
    throw new Error(extractError(e))
  }
}

export async function fetchPendingCreditsReport(
  params?: ReportDateParams,
): Promise<PendingCreditsReport> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/api/reports/pending-credits', {
      params: buildReportDateParams(params),
    })
    const itemsRaw = (data.items ?? data.Items ?? data) as unknown
    const items = Array.isArray(itemsRaw)
      ? itemsRaw.map((row) => mapPending(row as Record<string, unknown>))
      : []
    return {
      outstandingTotal: Number(data.outstandingTotal ?? data.OutstandingTotal ?? 0),
      items,
    }
  } catch (e) {
    if (!isAxiosNotFound(e)) throw new Error(extractError(e))
    return fetchPendingCreditsAggregated(params)
  }
}

export async function downloadPendingCreditsPdf(
  params?: ReportDateParams,
): Promise<{ fileName: string; blob: Blob }> {
  try {
    const response = await api.get<Blob>('/api/reports/pending-credits/export/pdf', {
      params: buildReportDateParams(params),
      responseType: 'blob',
    })

    const disposition = response.headers['content-disposition'] as string | undefined
    let fileName = `pending-credit-report-${new Date().toISOString().slice(0, 10)}.pdf`
    if (disposition) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
      if (match?.[1]) fileName = match[1].replace(/['"]/g, '')
    }

    const blob =
      response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })

    return { fileName, blob }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message) throw new Error(parsed.message)
      } catch {
        /* default */
      }
    }
    throw new Error(extractError(e))
  }
}
