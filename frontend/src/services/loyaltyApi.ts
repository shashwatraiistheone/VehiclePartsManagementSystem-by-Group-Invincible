import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export type CustomerLoyalty = {
  customerId: number
  loyaltyPoints: number
  totalSpent: number
  orderThreshold: number
  discountPercent: number
  isEligible: boolean
  progressPercent: number
  largestOrderSubtotal: number
  remainingAmount: number
  qualifyingOrderCount: number
  tier: string
  nextDiscountMessage: string
}

export type LoyaltyProgramCustomerRow = {
  customerId: number
  customerName: string
  email: string
  tier: string
  loyaltyPoints: number
  totalSpent: number
  qualifyingOrderCount: number
  isEligible: boolean
}

export type LoyaltyProgramSummary = {
  totalCustomers: number
  eligibleCustomers: number
  goldPlusCount: number
  goldCount: number
  silverCount: number
  memberCount: number
  orderThreshold: number
  discountPercent: number
  customers: LoyaltyProgramCustomerRow[]
}

function mapLoyaltyProgramSummary(raw: Record<string, unknown>): LoyaltyProgramSummary {
  const customersRaw = (raw.customers ?? raw.Customers ?? []) as Record<string, unknown>[]
  return {
    totalCustomers: Number(raw.totalCustomers ?? raw.TotalCustomers ?? 0),
    eligibleCustomers: Number(raw.eligibleCustomers ?? raw.EligibleCustomers ?? 0),
    goldPlusCount: Number(raw.goldPlusCount ?? raw.GoldPlusCount ?? 0),
    goldCount: Number(raw.goldCount ?? raw.GoldCount ?? 0),
    silverCount: Number(raw.silverCount ?? raw.SilverCount ?? 0),
    memberCount: Number(raw.memberCount ?? raw.MemberCount ?? 0),
    orderThreshold: Number(raw.orderThreshold ?? raw.OrderThreshold ?? 5000),
    discountPercent: Number(raw.discountPercent ?? raw.DiscountPercent ?? 10),
    customers: customersRaw.map((c) => ({
      customerId: Number(c.customerId ?? c.CustomerId ?? 0),
      customerName: String(c.customerName ?? c.CustomerName ?? ''),
      email: String(c.email ?? c.Email ?? ''),
      tier: String(c.tier ?? c.Tier ?? 'MEMBER'),
      loyaltyPoints: Number(c.loyaltyPoints ?? c.LoyaltyPoints ?? 0),
      totalSpent: Number(c.totalSpent ?? c.TotalSpent ?? 0),
      qualifyingOrderCount: Number(c.qualifyingOrderCount ?? c.QualifyingOrderCount ?? 0),
      isEligible: Boolean(c.isEligible ?? c.IsEligible ?? false),
    })),
  }
}

export async function fetchLoyaltyProgramSummary(): Promise<LoyaltyProgramSummary> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/api/Loyalty/summary')
    return mapLoyaltyProgramSummary(data)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchCustomerLoyalty(customerId: number): Promise<CustomerLoyalty> {
  try {
    const { data } = await api.get<CustomerLoyalty>(`/api/Loyalty/${customerId}`)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

/** Staff panel: GET /api/customer/{id}/loyalty */
export async function fetchCustomerLoyaltyPanel(customerId: number): Promise<CustomerLoyalty> {
  try {
    const { data } = await api.get<CustomerLoyalty>(`/api/customer/${customerId}/loyalty`)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}
