import { api, extractApiErrorMessage, normalizeAuthResponse } from '../lib/apiClient'
import type { LoginResponse } from './staffApi'

export type RegisterVehiclePayload = {
  vehicleNumber: string
  brand: string
  model: string
  year: number
  mileage: number
}

export type RegisterCustomerPayload = {
  name: string
  email: string
  phone: string
  password: string
  address?: string
  vehicles?: RegisterVehiclePayload[]
}

export async function login(payload: { email: string; password: string }): Promise<LoginResponse> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/auth/login', payload, {
      skipAuth: true,
    } as never)
    const normalized = normalizeAuthResponse(data)
    if (!normalized.token) {
      throw new Error('Login succeeded but no token was returned.')
    }
    return normalized
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Invalid email or password.'))
  }
}

export async function registerCustomer(payload: RegisterCustomerPayload): Promise<LoginResponse> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/auth/register', payload, {
      skipAuth: true,
    } as never)
    const normalized = normalizeAuthResponse(data)
    if (!normalized.token) {
      throw new Error('Registration succeeded but no token was returned.')
    }
    return normalized
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Registration failed.'))
  }
}
