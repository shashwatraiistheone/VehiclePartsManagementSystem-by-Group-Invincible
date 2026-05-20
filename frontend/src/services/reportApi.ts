import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractErrorMessage(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export type FinancialPeriod = 'daily' | 'monthly' | 'yearly' | 'custom'

export type FinancialBreakdown = {
  label: string
  from: string
  to: string
  revenue: number
  purchaseCost: number
  grossProfit: number
}

export type FinancialReport = {
  period: string
  from: string
  to: string
  revenue: number
  purchaseCost: number
  grossProfit: number
  salesCount: number
  purchaseCount: number
  breakdown: FinancialBreakdown[]
}

export type DashboardAnalytics = {
  labels: string[]
  monthlyRevenue: number[]
  monthlySalesCount: number[]
  monthlyUnitsSold: number[]
  pendingCreditsCount: number
  pendingCreditsAmount: number
  revenueTrendPercent?: number
  customersTrendPercent?: number
  salesTrendPercent?: number
  lowStockTrendPercent?: number
  pendingCreditsTrendPercent?: number
}

export type DashboardReport = {
  totalCustomers: number
  totalSales: number
  totalRevenue: number
  lowStockPartsCount: number
  pendingCreditsCount: number
  pendingCreditsAmount: number
  weeklyPurchaseItemsCount: number
  weeklyCustomerInteractions: number
  monthlyPurchaseCost: number
}

export async function fetchDashboardReport(): Promise<DashboardReport> {
  try {
    const { data } = await api.get<DashboardReport>('/api/report/dashboard')
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  try {
    const { data } = await api.get<DashboardAnalytics>('/api/report/analytics')
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function fetchFinancialReport(params: {
  period?: FinancialPeriod
  from?: string
  to?: string
}): Promise<FinancialReport> {
  try {
    const { data } = await api.get<FinancialReport>('/api/report/financial', { params })
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}
