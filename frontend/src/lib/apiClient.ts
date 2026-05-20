import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { clearSession, getToken } from './authStorage'

export const SESSION_EXPIRED_MESSAGE = 'Session expired. Please login again.'
export const UNAUTHORIZED_MESSAGE = 'You are not authorized to access this page.'

type ApiErrorBody = {
  message?: string
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

export type ApiRequestConfig = InternalAxiosRequestConfig & {
  /** Skip attaching Bearer token (login/register). */
  skipAuth?: boolean
  /** Do not trigger global session logout on 401. */
  skipAuthRedirect?: boolean
}

let unauthorizedHandler: (() => void) | null = null
let handlingUnauthorized = false

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

function getApiBaseUrl(): string {
  const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (!baseURL?.trim()) {
    throw new Error(
      'API is not configured. Set VITE_API_BASE_URL in frontend/.env (e.g. http://localhost:5218).',
    )
  }
  return baseURL.replace(/\/$/, '')
}

function triggerUnauthorized() {
  if (handlingUnauthorized) return
  handlingUnauthorized = true
  clearSession()
  unauthorizedHandler?.()
  window.setTimeout(() => {
    handlingUnauthorized = false
  }, 1500)
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    headers: { 'Content-Type': 'application/json' },
  })

  client.interceptors.request.use((config) => {
    const cfg = config as ApiRequestConfig
    if (!cfg.skipAuth) {
      const token = getToken()
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`
      }
    }
    return cfg
  })

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      const cfg = error.config as ApiRequestConfig | undefined
      const status = error.response?.status
      const url = cfg?.url ?? ''

      if (status === 401 && !cfg?.skipAuthRedirect && !url.includes('/api/auth/login')) {
        triggerUnauthorized()
      }

      return Promise.reject(error)
    },
  )

  return client
}

/** Shared authenticated HTTP client for all API modules. */
export const api = createApiClient()

/** Normalize login/register JSON (camelCase or PascalCase). */
export function normalizeAuthResponse(data: Record<string, unknown>) {
  return {
    token: String(data.token ?? data.Token ?? ''),
    userId: Number(data.userId ?? data.UserId ?? 0),
    name: String(data.name ?? data.Name ?? ''),
    email: String(data.email ?? data.Email ?? ''),
    role: String(data.role ?? data.Role ?? ''),
  }
}

export function extractApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<ApiErrorBody>
    const data = ax.response?.data
    const status = ax.response?.status

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message
    }
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail
    }
    if (data?.errors) {
      const first = Object.values(data.errors).flat().find(Boolean)
      if (first) return first
    }
    if (typeof data?.title === 'string' && data.title !== 'One or more validation errors occurred.') {
      return data.title
    }

    if (status === 401) {
      return ax.config?.url?.includes('/api/auth/login')
        ? 'Invalid email or password.'
        : SESSION_EXPIRED_MESSAGE
    }
    if (status === 403) {
      return 'You do not have permission to perform this action.'
    }
    if (status === 404) {
      return 'The requested resource was not found.'
    }
    if (status === 409) {
      return data?.message ?? 'This action conflicts with existing data.'
    }
    if (status && status >= 500) {
      return 'Server error. Please try again in a moment.'
    }

    if (ax.message.includes('Network Error')) {
      return 'Unable to reach the server. Check that the API is running and VITE_API_BASE_URL is correct.'
    }

    if (ax.message.includes('status code')) {
      return fallback
    }
  }

  if (error instanceof Error && error.message && !error.message.includes('status code')) {
    return error.message
  }

  return fallback
}
