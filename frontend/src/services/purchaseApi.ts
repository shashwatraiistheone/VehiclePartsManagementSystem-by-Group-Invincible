import axios from 'axios'
import { api, extractApiErrorMessage } from '../lib/apiClient'
import { getStoredUserName } from '../lib/auth'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return 'Purchase API not found. Restart the backend server.'
  }
  return extractApiErrorMessage(error, 'Request failed.')
}

function isAxiosNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export type PurchaseLineItem = {
  partId: number
  partName: string
  quantity: number
  costPrice: number
}

export type PurchaseInvoice = {
  id: number
  invoiceNumber: string
  vendorId: number
  vendorName: string
  purchaseDate: string
  notes: string
  processedBy: string
  totalAmount: number
  createdAt: string
  items: PurchaseLineItem[]
}

export type CreatePurchaseLine = {
  partId: number
  quantity: number
  costPrice: number
}

export type CreatePurchasePayload = {
  vendorId: number
  invoiceNumber?: string
  purchaseDate?: string
  notes?: string
  processedBy?: string
  items: CreatePurchaseLine[]
}

function mapLineItem(raw: Record<string, unknown>): PurchaseLineItem {
  return {
    partId: Number(raw.partId ?? raw.PartId ?? 0),
    partName: String(raw.partName ?? raw.PartName ?? ''),
    quantity: Number(raw.quantity ?? raw.Quantity ?? 0),
    costPrice: Number(raw.costPrice ?? raw.CostPrice ?? raw.price ?? raw.Price ?? 0),
  }
}

function mapPurchase(raw: Record<string, unknown>): PurchaseInvoice {
  const itemsRaw = (raw.items ?? raw.Items) as Record<string, unknown>[] | undefined
  const id = Number(raw.id ?? raw.Id ?? 0)
  const invoiceNumber = String(
    raw.invoiceNumber ?? raw.InvoiceNumber ?? (id ? `PI-${String(id).padStart(5, '0')}` : ''),
  )

  return {
    id,
    invoiceNumber,
    vendorId: Number(raw.vendorId ?? raw.VendorId ?? 0),
    vendorName: String(raw.vendorName ?? raw.VendorName ?? ''),
    purchaseDate: String(raw.purchaseDate ?? raw.PurchaseDate ?? raw.date ?? raw.Date ?? ''),
    notes: String(raw.notes ?? raw.Notes ?? ''),
    processedBy: String(raw.processedBy ?? raw.ProcessedBy ?? ''),
    totalAmount: Number(raw.totalAmount ?? raw.TotalAmount ?? 0),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? raw.purchaseDate ?? raw.PurchaseDate ?? ''),
    items: Array.isArray(itemsRaw) ? itemsRaw.map((row) => mapLineItem(row)) : [],
  }
}

export async function fetchPurchases(): Promise<PurchaseInvoice[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/purchase')
    return (data ?? []).map((row) => mapPurchase(row))
  } catch (error) {
    if (isAxiosNotFound(error)) return []
    throw new Error(extractErrorMessage(error))
  }
}

export async function fetchPurchase(id: number): Promise<PurchaseInvoice> {
  try {
    const { data } = await api.get<Record<string, unknown>>(`/api/purchase/${id}`)
    return mapPurchase(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function createPurchase(payload: CreatePurchasePayload): Promise<PurchaseInvoice> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/purchase', {
      vendorId: payload.vendorId,
      invoiceNumber: payload.invoiceNumber,
      purchaseDate: payload.purchaseDate,
      notes: payload.notes,
      processedBy: payload.processedBy ?? getStoredUserName() ?? 'Admin',
      items: payload.items.map((i) => ({
        partId: i.partId,
        quantity: i.quantity,
        costPrice: i.costPrice,
      })),
    })
    return mapPurchase(data)
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}
