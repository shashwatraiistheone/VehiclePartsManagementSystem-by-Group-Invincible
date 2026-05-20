import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export type PartRequest = {
  id: number
  customerId: number
  customerName: string
  partName: string
  vehicleDetails: string
  description: string
  quantity: number
  responseNotes?: string | null
  status: string
  createdAt: string
  updatedAt?: string | null
  vehicleId?: number | null
  fulfilledAt?: string | null
  fulfilledByStaffId?: number | null
  fulfilledByStaffName?: string | null
}

export type CreatePartRequestPayload = {
  partName: string
  vehicleDetails?: string
  vehicleId?: number
  description?: string
  quantity: number
}

export async function fetchAllPartRequests(): Promise<PartRequest[]> {
  const { data } = await api.get<PartRequest[]>('/api/part-requests')
  return data
}

export async function fetchPartRequestById(id: number): Promise<PartRequest> {
  try {
    const { data } = await api.get<PartRequest>(`/api/part-requests/${id}`)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchMyPartRequests(): Promise<PartRequest[]> {
  const { data } = await api.get<PartRequest[]>('/api/part-requests/my')
  return data
}

export async function createPartRequest(payload: CreatePartRequestPayload): Promise<PartRequest> {
  try {
    const { data } = await api.post<PartRequest>('/api/part-requests', payload)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function updatePartRequestStatus(
  id: number,
  status: string,
  responseNotes?: string,
): Promise<PartRequest> {
  try {
    const { data } = await api.patch<PartRequest>(`/api/part-requests/${id}/status`, {
      status,
      ...(responseNotes !== undefined ? { responseNotes } : {}),
    })
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fulfillPartRequest(id: number, responseNotes?: string): Promise<PartRequest> {
  try {
    const { data } = await api.put<PartRequest>(`/api/part-requests/${id}/fulfill`, {
      responseNotes: responseNotes?.trim() || undefined,
    })
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function rejectPartRequest(id: number, responseNotes?: string): Promise<PartRequest> {
  try {
    const { data } = await api.put<PartRequest>(`/api/part-requests/${id}/reject`, {
      responseNotes: responseNotes?.trim() || undefined,
    })
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchPartRequestsByCustomer(customerId: number): Promise<PartRequest[]> {
  const { data } = await api.get<PartRequest[]>(`/api/part-requests/customer/${customerId}`)
  return data
}

export async function deletePartRequest(id: number): Promise<void> {
  await api.delete(`/api/part-requests/${id}`)
}
