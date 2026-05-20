import axios from 'axios'
import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

function isAxiosNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export const LOW_STOCK_THRESHOLD = 3
export const LOW_STOCK_WARNING_THRESHOLD = 5

export type InventoryPart = {
  id: number
  partNumber: string
  name: string
  category: string
  description: string
  costPrice: number
  sellingPrice: number
  price: number
  quantity: number
  criticalStockLevel: number
  vendorId: number | null
  vendorName: string
  isActive: boolean
  status: string
  createdAt: string
}

export type CreatePartPayload = {
  partNumber: string
  name: string
  category: string
  description?: string
  costPrice: number
  sellingPrice: number
  quantity: number
  criticalStockLevel: number
  vendorId: number
  isActive?: boolean
}

export type PartPayload = {
  partNumber?: string
  name: string
  category?: string
  description?: string
  costPrice?: number
  sellingPrice?: number
  price?: number
  quantity: number
  criticalStockLevel?: number
  vendorId?: number | null
  isActive?: boolean
}

function parseLegacyMeta(description: string) {
  const d = description?.trim() ?? ''
  if (!d.includes('|')) return { brand: '', category: 'General' }
  const i = d.indexOf('|')
  return { brand: d.slice(0, i).trim(), category: d.slice(i + 1).trim() || 'General' }
}

function mapPart(raw: Record<string, unknown>): InventoryPart {
  const id = Number(raw.id ?? raw.Id ?? 0)
  const description = String(raw.description ?? raw.Description ?? '')
  const legacy = parseLegacyMeta(description)
  const isActiveRaw = raw.isActive ?? raw.IsActive
  const isActive = isActiveRaw !== false

  return {
    id,
    partNumber: String(raw.partNumber ?? raw.PartNumber ?? `P-${String(id).padStart(4, '0')}`),
    name: String(raw.name ?? raw.Name ?? ''),
    category: String(raw.category ?? raw.Category ?? legacy.category),
    description,
    costPrice: Number(raw.costPrice ?? raw.CostPrice ?? 0),
    sellingPrice: Number(
      raw.sellingPrice ?? raw.SellingPrice ?? raw.price ?? raw.Price ?? 0,
    ),
    price: Number(raw.sellingPrice ?? raw.SellingPrice ?? raw.price ?? raw.Price ?? 0),
    quantity: Number(raw.quantity ?? raw.Quantity ?? 0),
    criticalStockLevel: Number(
      raw.criticalStockLevel ?? raw.CriticalStockLevel ?? LOW_STOCK_THRESHOLD,
    ),
    vendorId: (raw.vendorId ?? raw.VendorId) as number | null | undefined ?? null,
    vendorName: String(raw.vendorName ?? raw.VendorName ?? '—'),
    isActive,
    status: String(raw.status ?? raw.Status ?? (isActive ? 'Active' : 'Inactive')),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
  }
}

export async function fetchParts(): Promise<InventoryPart[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/parts')
    return data.map((row) => mapPart(row))
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function createPart(payload: CreatePartPayload): Promise<InventoryPart> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/parts', payload)
    return mapPart(data)
  } catch (error) {
    throw new Error(extractError(error))
  }
}

function toUpdateBody(payload: PartPayload): Record<string, unknown> {
  const selling = payload.sellingPrice ?? payload.price ?? 0
  return {
    partNumber: payload.partNumber,
    name: payload.name,
    category: payload.category,
    description: payload.description,
    costPrice: payload.costPrice ?? 0,
    sellingPrice: selling,
    quantity: payload.quantity,
    criticalStockLevel: payload.criticalStockLevel,
    vendorId: payload.vendorId,
    isActive: payload.isActive,
  }
}

export async function updatePart(id: number, payload: PartPayload): Promise<InventoryPart> {
  try {
    const { data } = await api.put<Record<string, unknown>>(`/api/parts/${id}`, toUpdateBody(payload))
    return mapPart(data)
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function deletePart(id: number): Promise<void> {
  try {
    await api.delete(`/api/parts/${id}`)
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function deactivatePart(id: number, current: InventoryPart): Promise<InventoryPart> {
  try {
    const { data } = await api.patch<Record<string, unknown>>(`/api/parts/${id}/deactivate`)
    return mapPart(data)
  } catch (error) {
    if (!isAxiosNotFound(error)) throw new Error(extractError(error))
    return updatePart(id, {
      partNumber: current.partNumber,
      name: current.name,
      category: current.category,
      description: current.description,
      price: current.price,
      quantity: current.quantity,
      vendorId: current.vendorId,
      isActive: false,
    })
  }
}

export function isLowStock(quantity: number, criticalStockLevel = LOW_STOCK_THRESHOLD): boolean {
  return quantity <= criticalStockLevel
}

export function stockLevelLabel(
  quantity: number,
  criticalStockLevel = LOW_STOCK_THRESHOLD,
): { label: string; tone: 'critical' | 'warning' | 'ok' } {
  if (quantity <= 0) return { label: 'Critical', tone: 'critical' }
  if (quantity <= criticalStockLevel) return { label: 'Low Stock', tone: 'warning' }
  if (quantity < LOW_STOCK_WARNING_THRESHOLD) return { label: 'Low Stock', tone: 'warning' }
  return { label: 'In Stock', tone: 'ok' }
}
