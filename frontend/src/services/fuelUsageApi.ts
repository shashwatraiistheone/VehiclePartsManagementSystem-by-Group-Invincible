import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export type FuelUsageLog = {
  id: number
  customerId: number
  vehicleId: number
  vehicleNumber: string
  odometerKm: number
  odometerMiles: number
  fuelAmountLiters: number
  fuelType: string
  fuelCost: number
  logDate: string
  notes?: string | null
  createdAt: string
}

export type FuelUsageAnalytics = {
  latestOdometerKm: number
  latestOdometerMiles: number
  totalLogCount: number
  hasSufficientData: boolean
  lastLogDate?: string | null
  avgMpg?: number | null
  recentLogs: FuelUsageLog[]
}

export async function createFuelUsageLog(payload: {
  vehicleId: number
  odometerKm: number
  fuelAmountLiters: number
  fuelType: string
  fuelCost: number
  logDate?: string
  notes?: string
}): Promise<FuelUsageLog> {
  try {
    const { data } = await api.post<FuelUsageLog>('/api/fuel-usage', payload)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function updateVehicleUsage(payload: {
  vehicleId: number
  odometerKm: number
  conditionNotes?: string
}): Promise<FuelUsageLog> {
  try {
    const { data } = await api.post<FuelUsageLog>('/api/fuel-usage/update-usage', payload)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchFuelUsageAnalytics(): Promise<FuelUsageAnalytics> {
  const { data } = await api.get<FuelUsageAnalytics>('/api/fuel-usage/my/analytics')
  return data
}

export function milesToKm(miles: number): number {
  return Math.round(miles / 0.621371)
}

export function kmToMiles(km: number): number {
  return Math.round(km * 0.621371)
}
