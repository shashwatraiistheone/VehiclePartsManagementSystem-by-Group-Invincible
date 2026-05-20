import axios from 'axios'
import { api } from '../lib/apiClient'

function isAxiosNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export type MaintenancePrediction = {
  component: string
  riskLevel: string
  recommendation: string
  estimatedKmUntilService: number
}

export type ComponentPrediction = {
  component: string
  severity: string
  healthPercent: number
  confidencePercent: number
  estimatedMilesUntilService: number
  summary: string
  recommendation: string
  predictionDate: string
}

export type VehicleMaintenanceDashboard = {
  vehicleId: number
  vehicleNumber: string
  brand: string
  model: string
  year: number
  mileageKm: number
  mileageMiles: number
  lastUpdated: string
  hasUsageData: boolean
  components: ComponentPrediction[]
}

export type FuelUsageAnalytics = {
  latestOdometerKm: number
  latestOdometerMiles: number
  totalLogCount: number
  hasSufficientData: boolean
  lastLogDate?: string | null
  avgMpg?: number | null
  recentLogs: {
    id: number
    vehicleNumber: string
    odometerMiles: number
    fuelAmountLiters: number
    fuelType: string
    logDate: string
  }[]
}

export type MaintenanceDashboard = {
  fleetHealthScore: number
  generatedAt: string
  vehicles: VehicleMaintenanceDashboard[]
  fuelUsageAnalytics: FuelUsageAnalytics
}

export async function fetchMyPredictions(): Promise<MaintenancePrediction[]> {
  const { data } = await api.get<MaintenancePrediction[]>('/api/predictions/my')
  return data
}

export async function fetchMaintenanceDashboard(): Promise<MaintenanceDashboard> {
  try {
    const { data } = await api.get<MaintenanceDashboard>('/api/predictions/my/dashboard')
    return data
  } catch (e) {
    if (isAxiosNotFound(e)) {
      const { data } = await api.get<MaintenanceDashboard>('/api/maintenance/predictions')
      return data
    }
    throw e
  }
}
