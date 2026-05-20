import axios from 'axios'
import { api, extractApiErrorMessage } from '../lib/apiClient'
import { fetchParts, isLowStock, LOW_STOCK_THRESHOLD, type InventoryPart } from './partsApi'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

function isAxiosNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export type NotificationSeverity = 'Critical' | 'Warning' | 'Info'

export type InventoryNotification = {
  id: number
  partId: number
  partNumber: string
  partName: string
  stockQuantity: number
  criticalStockLevel: number
  message: string
  severity: NotificationSeverity
  isRead: boolean
  createdAt: string
}

function mapRow(raw: Record<string, unknown>): InventoryNotification {
  const severity = String(raw.severity ?? raw.Severity ?? 'Warning') as NotificationSeverity
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    partId: Number(raw.partId ?? raw.PartId ?? 0),
    partNumber: String(raw.partNumber ?? raw.PartNumber ?? ''),
    partName: String(raw.partName ?? raw.PartName ?? ''),
    stockQuantity: Number(raw.stockQuantity ?? raw.StockQuantity ?? 0),
    criticalStockLevel: Number(raw.criticalStockLevel ?? raw.CriticalStockLevel ?? LOW_STOCK_THRESHOLD),
    message: String(raw.message ?? raw.Message ?? ''),
    severity: severity === 'Critical' || severity === 'Info' ? severity : 'Warning',
    isRead: Boolean(raw.isRead ?? raw.IsRead),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString()),
  }
}

function buildMessage(part: InventoryPart): string {
  return `Alert: ${part.name} (${part.partNumber}) is below reorder level. Current Stock: ${part.quantity}`
}

function severityFor(part: InventoryPart): NotificationSeverity {
  const threshold = part.criticalStockLevel ?? LOW_STOCK_THRESHOLD
  if (part.quantity <= 0) return 'Critical'
  if (part.quantity <= threshold) return 'Warning'
  return 'Info'
}

function buildFromParts(parts: InventoryPart[], limit?: number): InventoryNotification[] {
  const low = parts
    .filter((p) => p.isActive && isLowStock(p.quantity, p.criticalStockLevel ?? LOW_STOCK_THRESHOLD))
    .sort((a, b) => a.quantity - b.quantity)
    .map((p, i) => ({
      id: -(i + 1),
      partId: p.id,
      partNumber: p.partNumber,
      partName: p.name,
      stockQuantity: p.quantity,
      criticalStockLevel: p.criticalStockLevel ?? LOW_STOCK_THRESHOLD,
      message: buildMessage(p),
      severity: severityFor(p),
      isRead: false,
      createdAt: p.createdAt || new Date().toISOString(),
    }))
  return limit ? low.slice(0, limit) : low
}

export async function fetchInventoryNotifications(limit?: number): Promise<InventoryNotification[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/inventory-notifications', {
      params: limit ? { limit } : undefined,
    })
    return data.map((row) => mapRow(row))
  } catch (error) {
    if (!isAxiosNotFound(error)) throw new Error(extractError(error))
    const parts = await fetchParts()
    return buildFromParts(parts, limit)
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const { data } = await api.get<{ count?: number; Count?: number }>('/api/inventory-notifications/unread-count')
    return Number(data.count ?? data.Count ?? 0)
  } catch (error) {
    if (!isAxiosNotFound(error)) throw new Error(extractError(error))
    const parts = await fetchParts()
    return buildFromParts(parts).length
  }
}

export async function markNotificationRead(id: number): Promise<void> {
  if (id < 0) return
  try {
    await api.post(`/api/inventory-notifications/${id}/read`)
  } catch (error) {
    if (!isAxiosNotFound(error)) throw new Error(extractError(error))
  }
}

export function formatNotificationTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function severityStyles(severity: NotificationSeverity, isRead: boolean) {
  const faded = isRead ? 'opacity-60' : ''
  switch (severity) {
    case 'Critical':
      return {
        card: `border-red-200 bg-red-50/80 ${faded}`,
        icon: 'bg-red-100 text-red-500',
        accent: 'text-red-700',
        glow: !isRead ? 'ring-2 ring-red-200/60' : '',
      }
    case 'Info':
      return {
        card: `border-blue-200 bg-blue-50/60 ${faded}`,
        icon: 'bg-blue-100 text-blue-500',
        accent: 'text-blue-700',
        glow: !isRead ? 'ring-2 ring-blue-200/60' : '',
      }
    default:
      return {
        card: `border-amber-200 bg-amber-50/70 ${faded}`,
        icon: 'bg-amber-100 text-amber-600',
        accent: 'text-amber-800',
        glow: !isRead ? 'ring-2 ring-amber-200/60' : '',
      }
  }
}
