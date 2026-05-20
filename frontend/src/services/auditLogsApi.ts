import axios, { type AxiosError } from 'axios'
import { api } from '../lib/apiClient'

export type AuditLogDto = {
  id: number
  timestamp: string
  action: string
  details: string
  entity: string
  entityType: string
  performedBy: string
}

export async function fetchAuditLogs(params?: {
  action?: string
  search?: string
  limit?: number
}): Promise<AuditLogDto[]> {
  try {
    const { data } = await api.get<AuditLogDto[]>('/api/AuditLogs', { params })
    return data
  } catch (err) {
    if (axios.isAxiosError(err) && (err as AxiosError).response?.status === 404) {
      return []
    }
    throw err
  }
}
