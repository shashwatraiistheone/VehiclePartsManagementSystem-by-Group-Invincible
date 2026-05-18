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
  }
  if (error instanceof Error) return error.message
  return 'Request failed'
}

export type StaffMember = {
  id: number
  fullName: string
  email: string
  phone: string
  role: string
  isActive: boolean
  createdAt: string
}

export type RegisterStaffPayload = {
  fullName: string
  email: string
  phone: string
  password: string
  role: 'Admin' | 'Staff'
}

export type UpdateStaffPayload = {
  fullName: string
  phone: string
  role: 'Admin' | 'Staff'
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  userId: number
  name: string
  email: string
  role: string
}

export async function loginStaff(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/api/auth/login', payload)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function fetchStaff(): Promise<StaffMember[]> {
  try {
    const { data } = await api.get<StaffMember[]>('/api/staff')
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function registerStaff(payload: RegisterStaffPayload): Promise<StaffMember> {
  try {
    const { data } = await api.post<StaffMember>('/api/staff', payload)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function updateStaff(id: number, payload: UpdateStaffPayload): Promise<StaffMember> {
  try {
    const { data } = await api.put<StaffMember>(`/api/staff/${id}`, payload)
    return data
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function deactivateStaff(id: number): Promise<void> {
  try {
    await api.patch(`/api/staff/${id}/deactivate`)
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}

export async function deleteStaff(id: number): Promise<void> {
  try {
    await api.delete(`/api/staff/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error))
  }
}
