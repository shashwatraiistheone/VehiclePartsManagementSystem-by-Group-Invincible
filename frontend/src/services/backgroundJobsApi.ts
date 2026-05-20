import { api } from '../lib/apiClient'

export type BackgroundJobDefinitionDto = {
  id: string
  name: string
  queue: string
  status: string
  lastRun: string
  nextRun?: string
}

export type BackgroundJobHistoryPointDto = {
  time: string
  completed: number
  failed: number
}

export type BackgroundJobsDashboardDto = {
  jobs: BackgroundJobDefinitionDto[]
  history: BackgroundJobHistoryPointDto[]
  totalRuns: number
  failedRuns: number
  successRate: number
}

export async function fetchBackgroundJobsDashboard(): Promise<BackgroundJobsDashboardDto> {
  const { data } = await api.get<BackgroundJobsDashboardDto>('/api/BackgroundJobs/dashboard')
  return data
}
