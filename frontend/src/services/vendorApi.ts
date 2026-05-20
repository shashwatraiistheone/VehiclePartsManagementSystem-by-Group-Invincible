import axios from 'axios'
import { api, extractApiErrorMessage } from '../lib/apiClient'

function isAxiosNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export type Vendor = {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  notes: string
  isActive: boolean
  status: string
  totalPurchases: number
  createdAt: string
}

export type CreateVendorPayload = {
  name: string
  contactPerson: string
  phone: string
  email: string
  address?: string
  notes?: string
}

export type UpdateVendorPayload = CreateVendorPayload & {
  isActive?: boolean
}

function mapVendor(raw: Record<string, unknown>): Vendor {
  const isActiveRaw = raw.isActive ?? raw.IsActive
  const isActive = isActiveRaw !== false
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    name: String(raw.name ?? raw.Name ?? ''),
    contactPerson: String(raw.contactPerson ?? raw.ContactPerson ?? ''),
    phone: String(raw.phone ?? raw.Phone ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    address: String(raw.address ?? raw.Address ?? ''),
    notes: String(raw.notes ?? raw.Notes ?? ''),
    isActive,
    status: String(raw.status ?? raw.Status ?? (isActive ? 'Active' : 'Inactive')),
    totalPurchases: Number(raw.totalPurchases ?? raw.TotalPurchases ?? 0),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? ''),
  }
}

export async function fetchVendors(): Promise<Vendor[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/vendors')
    return data.map((row) => mapVendor(row))
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to load vendors.'))
  }
}

export async function createVendor(payload: CreateVendorPayload): Promise<Vendor> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/vendors', payload)
    return mapVendor(data)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to create vendor.'))
  }
}

export async function updateVendor(id: number, payload: UpdateVendorPayload): Promise<Vendor> {
  try {
    const { data } = await api.put<Record<string, unknown>>(`/api/vendors/${id}`, payload)
    return mapVendor(data)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update vendor.'))
  }
}

export async function deactivateVendor(id: number, current: Vendor): Promise<Vendor> {
  try {
    const { data } = await api.patch<Record<string, unknown>>(`/api/vendors/${id}/deactivate`)
    return mapVendor(data)
  } catch (error) {
    if (!isAxiosNotFound(error)) {
      throw new Error(extractApiErrorMessage(error, 'Failed to deactivate vendor.'))
    }
    return updateVendor(id, {
      name: current.name,
      contactPerson: current.contactPerson,
      phone: current.phone,
      email: current.email,
      address: current.address,
      notes: current.notes,
      isActive: false,
    })
  }
}

export async function deleteVendor(id: number): Promise<void> {
  try {
    await api.delete(`/api/vendors/${id}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete vendor.'))
  }
}
