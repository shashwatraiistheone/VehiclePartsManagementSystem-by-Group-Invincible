import axios from 'axios'
import {
  ADVANCE_BOOKING_ERROR,
  APPOINTMENT_TIME_SLOTS,
  MAX_BOOKINGS_PER_SLOT,
  MIN_ADVANCE_HOURS,
  meetsAdvanceBookingRule,
  getTimezoneOffsetMinutes,
} from '../components/customer-portal/appointmentConstants'
import { api, extractApiErrorMessage } from '../lib/apiClient'

let appointmentTimezoneHooked = false
function ensureAppointmentTimezoneHeader() {
  if (appointmentTimezoneHooked) return
  appointmentTimezoneHooked = true
  api.interceptors.request.use((config) => {
    const url = config.url ?? ''
    if (url.includes('/api/Appointments') || url.includes('/api/appointments')) {
      config.headers['X-Timezone-Offset'] = String(getTimezoneOffsetMinutes())
    }
    return config
  })
}
ensureAppointmentTimezoneHeader()

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export type Appointment = {
  id: number
  customerId: number
  customerName: string
  customerPhone: string
  vehicleNumber?: string | null
  vehicleMakeModel?: string | null
  serviceType: string
  status: string
  date: string
  notes?: string | null
  estimatedCost?: number | null
}

export type AppointmentsSummary = {
  pending: number
  confirmed: number
  cancelled: number
  completed: number
}

export type AppointmentsListResponse = {
  summary: AppointmentsSummary
  items: Appointment[]
}

export type AppointmentFilterParams = {
  status?: string
  fromDate?: string
  toDate?: string
  serviceType?: string
  search?: string
}

function mapAppointment(raw: Record<string, unknown>): Appointment {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    customerPhone: String(raw.customerPhone ?? raw.CustomerPhone ?? ''),
    vehicleNumber: (raw.vehicleNumber ?? raw.VehicleNumber ?? null) as string | null,
    vehicleMakeModel: (raw.vehicleMakeModel ?? raw.VehicleMakeModel ?? null) as string | null,
    serviceType: String(raw.serviceType ?? raw.ServiceType ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    date: String(raw.date ?? raw.Date ?? ''),
    notes: (raw.notes ?? raw.Notes ?? null) as string | null,
    estimatedCost: raw.estimatedCost != null || raw.EstimatedCost != null
      ? Number(raw.estimatedCost ?? raw.EstimatedCost)
      : null,
  }
}

function mapSummary(raw: Record<string, unknown>): AppointmentsSummary {
  return {
    pending: Number(raw.pending ?? raw.Pending ?? 0),
    confirmed: Number(raw.confirmed ?? raw.Confirmed ?? 0),
    cancelled: Number(raw.cancelled ?? raw.Cancelled ?? 0),
    completed: Number(raw.completed ?? raw.Completed ?? 0),
  }
}

function buildFilterParams(params?: AppointmentFilterParams) {
  if (!params) return undefined
  return {
    ...(params.status ? { status: params.status } : {}),
    ...(params.fromDate ? { fromDate: params.fromDate } : {}),
    ...(params.toDate ? { toDate: params.toDate } : {}),
    ...(params.serviceType ? { serviceType: params.serviceType } : {}),
    ...(params.search ? { search: params.search } : {}),
  }
}

export async function fetchAppointments(
  params?: AppointmentFilterParams,
): Promise<AppointmentsListResponse> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/api/Appointments', {
      params: buildFilterParams(params),
    })
    const itemsRaw = (data.items ?? data.Items ?? data) as unknown
    const items = Array.isArray(itemsRaw)
      ? itemsRaw.map((row) => mapAppointment(row as Record<string, unknown>))
      : []
    const summaryRaw = (data.summary ?? data.Summary ?? {}) as Record<string, unknown>
    return {
      summary: mapSummary(summaryRaw),
      items,
    }
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchMyAppointments(): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>('/api/Appointments/my')
  return data.map((row) =>
    mapAppointment(row as unknown as Record<string, unknown>),
  )
}

export async function fetchServiceTypes(): Promise<string[]> {
  try {
    const { data } = await api.get<string[]>('/api/Appointments/service-types')
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function downloadAppointmentsPdf(
  params?: AppointmentFilterParams,
): Promise<{ fileName: string; blob: Blob }> {
  try {
    const response = await api.get<Blob>('/api/Appointments/export/pdf', {
      params: buildFilterParams(params),
      responseType: 'blob',
    })

    const disposition = response.headers['content-disposition'] as string | undefined
    let fileName = `appointments-report-${new Date().toISOString().slice(0, 10)}.pdf`
    if (disposition) {
      const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition)
      if (match?.[1]) fileName = match[1].replace(/['"]/g, '')
    }

    const blob =
      response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' })

    return { fileName, blob }
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text()
        const parsed = JSON.parse(text) as { message?: string }
        if (parsed.message) throw new Error(parsed.message)
      } catch {
        /* default */
      }
    }
    throw new Error(extractError(e))
  }
}

export type SlotAvailability = {
  time: string
  label: string
  booked: number
  max: number
  isFull: boolean
  isBookable: boolean
  reason?: string | null
}

export type DaySlotAvailability = {
  date: string
  serverNowUtc: string
  minAdvanceHours: number
  slots: SlotAvailability[]
}

function buildClientSlotAvailability(date: string): DaySlotAvailability {
  const now = new Date()
  return {
    date,
    serverNowUtc: now.toISOString(),
    minAdvanceHours: MIN_ADVANCE_HOURS,
    slots: APPOINTMENT_TIME_SLOTS.map(({ value, label }) => {
      const meetsAdvance = meetsAdvanceBookingRule(date, value, now)
      return {
        time: value,
        label,
        booked: 0,
        max: MAX_BOOKINGS_PER_SLOT,
        isFull: false,
        isBookable: meetsAdvance,
        reason: meetsAdvance ? null : ADVANCE_BOOKING_ERROR,
      }
    }),
  }
}

export async function fetchSlotAvailability(date: string): Promise<DaySlotAvailability> {
  try {
    const { data } = await api.get<DaySlotAvailability>('/api/Appointments/availability', {
      params: { date },
    })
    return data
  } catch (e) {
    // Server may fail on untranslatable LINQ until backend is rebuilt; use client-side slots.
    if (axios.isAxiosError(e) && (e.response?.status === 404 || e.response?.status === 500)) {
      return buildClientSlotAvailability(date)
    }
    throw new Error(extractError(e))
  }
}

export async function createAppointment(payload: {
  customerId?: number
  serviceType: string
  date?: string
  status?: string
  vehicleNumber?: string
  notes?: string
}): Promise<Appointment> {
  try {
    const { data } = await api.post<Appointment>('/api/Appointments', payload)
    return mapAppointment(data as unknown as Record<string, unknown>)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function updateAppointment(
  id: number,
  payload: {
    serviceType?: string
    status?: string
    date?: string
    vehicleNumber?: string
    notes?: string
  },
): Promise<void> {
  try {
    await api.put(`/api/Appointments/${id}`, payload)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function cancelAppointment(id: number, cancellationReason?: string): Promise<void> {
  try {
    await api.put(`/api/Appointments/${id}`, {
      status: 'Cancelled',
      ...(cancellationReason ? { notes: cancellationReason } : {}),
    })
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function updateAppointmentStatus(id: number, status: string): Promise<void> {
  try {
    await api.put(`/api/Appointments/${id}/status`, { status })
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export type AppointmentCustomerDetail = {
  id: number
  name: string
  phone: string
  email: string
  address: string
}

export type AppointmentVehicleDetail = {
  make: string
  model: string
  year: number
  vin: string | null
  registrationNumber: string
}

export type AppointmentHistoryItem = {
  id: number
  date: string
  status: string
  serviceType: string
}

export type AppointmentDetail = {
  id: number
  customerId: number
  serviceType: string
  status: string
  date: string
  createdAt: string
  notes: string | null
  estimatedCost: number | null
  customer: AppointmentCustomerDetail
  vehicle: AppointmentVehicleDetail | null
  history: AppointmentHistoryItem[]
}

function mapCustomerDetail(raw: Record<string, unknown>): AppointmentCustomerDetail {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    name: String(raw.name ?? raw.Name ?? ''),
    phone: String(raw.phone ?? raw.Phone ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    address: String(raw.address ?? raw.Address ?? ''),
  }
}

function mapVehicleDetail(raw: Record<string, unknown>): AppointmentVehicleDetail {
  return {
    make: String(raw.make ?? raw.Make ?? ''),
    model: String(raw.model ?? raw.Model ?? ''),
    year: Number(raw.year ?? raw.Year ?? 0),
    vin: (raw.vin ?? raw.Vin ?? null) as string | null,
    registrationNumber: String(raw.registrationNumber ?? raw.RegistrationNumber ?? ''),
  }
}

function mapHistoryItem(raw: Record<string, unknown>): AppointmentHistoryItem {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    date: String(raw.date ?? raw.Date ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    serviceType: String(raw.serviceType ?? raw.ServiceType ?? ''),
  }
}

function mapAppointmentDetail(raw: Record<string, unknown>): AppointmentDetail {
  const customerRaw = (raw.customer ?? raw.Customer ?? {}) as Record<string, unknown>
  const vehicleRaw = raw.vehicle ?? raw.Vehicle
  const historyRaw = (raw.history ?? raw.History ?? []) as unknown

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    serviceType: String(raw.serviceType ?? raw.ServiceType ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    date: String(raw.date ?? raw.Date ?? ''),
    createdAt: String(raw.createdAt ?? raw.CreatedAt ?? raw.date ?? raw.Date ?? ''),
    notes: (raw.notes ?? raw.Notes ?? null) as string | null,
    estimatedCost:
      raw.estimatedCost != null || raw.EstimatedCost != null
        ? Number(raw.estimatedCost ?? raw.EstimatedCost)
        : null,
    customer: mapCustomerDetail(customerRaw),
    vehicle:
      vehicleRaw && typeof vehicleRaw === 'object'
        ? mapVehicleDetail(vehicleRaw as Record<string, unknown>)
        : null,
    history: Array.isArray(historyRaw)
      ? historyRaw.map((h) => mapHistoryItem(h as Record<string, unknown>))
      : [],
  }
}

export async function fetchAppointmentDetail(id: number): Promise<AppointmentDetail> {
  try {
    const { data } = await api.get<Record<string, unknown>>(`/api/Appointments/${id}`)
    return mapAppointmentDetail(data)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function confirmAppointment(id: number): Promise<void> {
  try {
    await api.put(`/api/Appointments/${id}/confirm`)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function cancelAppointmentById(id: number): Promise<void> {
  try {
    await api.put(`/api/Appointments/${id}/cancel`)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function rescheduleAppointment(
  id: number,
  date: string,
  time: string,
): Promise<void> {
  try {
    await api.put(`/api/Appointments/${id}/reschedule`, { date, time })
  } catch (e) {
    throw new Error(extractError(e))
  }
}
