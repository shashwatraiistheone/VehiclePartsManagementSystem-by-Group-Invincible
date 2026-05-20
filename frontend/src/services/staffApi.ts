import { api, extractApiErrorMessage } from '../lib/apiClient'

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
  const { login } = await import('./authApi')
  return login(payload)
}

export async function fetchStaff(): Promise<StaffMember[]> {
  try {
    const { data } = await api.get<StaffMember[]>('/api/staff')
    return data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to load staff.'))
  }
}

export async function registerStaff(payload: RegisterStaffPayload): Promise<StaffMember> {
  try {
    const { data } = await api.post<StaffMember>('/api/staff', payload)
    return data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to register staff.'))
  }
}

export async function updateStaff(id: number, payload: UpdateStaffPayload): Promise<StaffMember> {
  try {
    const { data } = await api.put<StaffMember>(`/api/staff/${id}`, payload)
    return data
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to update staff.'))
  }
}

export async function deactivateStaff(id: number): Promise<void> {
  try {
    await api.patch(`/api/staff/${id}/deactivate`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to deactivate staff.'))
  }
}

export async function deleteStaff(id: number): Promise<void> {
  try {
    await api.delete(`/api/staff/${id}`)
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Failed to delete staff.'))
  }
}
