import axios, { type AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined

function requireBaseUrl(): string {
  if (!baseURL) {
    throw new Error('Missing VITE_API_BASE_URL. Add it to frontend/.env')
  }
  return baseURL
}

const api = axios.create({
  baseURL: requireBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ message?: string; title?: string }>
    const data = ax.response?.data
    if (typeof data?.message === 'string') return data.message
    if (typeof data?.title === 'string') return data.title
    if (ax.response?.status === 401) return 'Unauthorized. Please sign in again.'
    if (ax.response?.status === 403) return 'You do not have permission to perform this action.'
    if (ax.response?.status === 409) return data?.message ?? 'This action conflicts with existing data.'
  }
  if (error instanceof Error) return error.message
  return 'Request failed'
}

export type Vendor = {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  createdAt: string
}

export type CreateVendorPayload = {
  name: string
  contactPerson: string
  phone: string
  email: string
  address?: string
}

export type UpdateVendorPayload = CreateVendorPayload

export async function fetchVendors(): Promise<Vendor[]> {
  try {
    const { data } = await api.get<Vendor[]>('/api/vendors')
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function createVendor(payload: CreateVendorPayload): Promise<Vendor> {
  try {
    const { data } = await api.post<Vendor>('/api/vendors', payload)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function updateVendor(id: number, payload: UpdateVendorPayload): Promise<Vendor> {
  try {
    const { data } = await api.put<Vendor>(`/api/vendors/${id}`, payload)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function deleteVendor(id: number): Promise<void> {
  try {
    await api.delete(`/api/vendors/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}
