import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export type Vehicle = {
  id: number
  customerId: number
  vehicleNumber: string
  brand: string
  model: string
  year: number
  mileage: number
  vin?: string | null
  notes?: string | null
  lastServiceDate?: string | null
}

export type VehicleInput = {
  vehicleNumber: string
  brand: string
  model: string
  year: number
  mileage: number
  vin?: string
  notes?: string
}

export type CustomerDetail = {
  id: number
  name: string
  email: string
  phone: string
  address: string
  vehicles: Vehicle[]
  totalPurchases: number
  totalSpent: number
  lastPurchaseDate?: string | null
  createdAt?: string | null
  pendingCredits: {
    invoiceId: number
    saleId: number
    invoiceNumber: string
    amount: number
    createdDate: string
  }[]
}

export type CustomerSearchResult = {
  id: number
  name: string
  phone: string
  email: string
  address: string
  vehicles: Vehicle[]
  totalPurchases: number
  lastVisitDate?: string | null
  createdAt?: string | null
  status: string
}

export type CustomerHistory = {
  customerId: number
  customerName: string
  customerEmail: string
  purchases: {
    saleId: number
    invoiceNumber?: string
    paymentStatus?: string
    date: string
    totalAmount: number
    discount: number
    finalAmount: number
    isInvoiceSent: boolean
    invoiceSentDate?: string | null
    items: { partId: number; partName: string; quantity: number; price: number }[]
  }[]
  services: {
    appointmentId: number
    serviceType: string
    status: string
    vehicleNumber?: string | null
    date: string
    notes?: string | null
    assignedStaff?: string | null
  }[]
}

export type PagedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type PurchaseHistoryRecord = CustomerHistory['purchases'][number]
export type ServiceHistoryRecord = CustomerHistory['services'][number]

function mapPaged<T>(data: {
  items?: T[]
  Items?: T[]
  page?: number
  Page?: number
  pageSize?: number
  PageSize?: number
  totalCount?: number
  TotalCount?: number
  totalPages?: number
  TotalPages?: number
}): PagedResult<T> {
  return {
    items: data.items ?? data.Items ?? [],
    page: data.page ?? data.Page ?? 1,
    pageSize: data.pageSize ?? data.PageSize ?? 5,
    totalCount: data.totalCount ?? data.TotalCount ?? 0,
    totalPages: data.totalPages ?? data.TotalPages ?? 0,
  }
}

export type CustomerReports = {
  regularCustomers: ReportRow[]
  highSpenders: ReportRow[]
  pendingCreditCustomers: ReportRow[]
}

export type ReportRow = {
  customerId: number
  name: string
  phone: string
  email: string
  purchaseCount: number
  totalSpent: number
  pendingCreditAmount: number
}

export async function fetchCustomers(): Promise<CustomerSearchResult[]> {
  const { data } = await api.get<CustomerSearchResult[]>('/api/Customer')
  return data.map((c) => ({
    ...c,
    vehicles: c.vehicles ?? [],
    status: c.status ?? (c.totalPurchases > 0 ? 'Active' : 'Inactive'),
  }))
}

export async function searchCustomers(q: string): Promise<CustomerSearchResult[]> {
  const term = q.trim()
  if (!term) {
    return fetchCustomers()
  }
  const { data } = await api.get<CustomerSearchResult[]>('/api/Customer/find', { params: { q: term } })
  return data.map((c) => ({
    ...c,
    vehicles: c.vehicles ?? [],
    status: c.status ?? (c.totalPurchases > 0 ? 'Active' : 'Inactive'),
  }))
}

export type CustomerNotification = {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

export async function fetchMyProfile(): Promise<CustomerDetail> {
  const { data } = await api.get<CustomerDetail>('/api/Customer/me')
  return data
}

export async function fetchMyNotifications(): Promise<CustomerNotification[]> {
  const { data } = await api.get<CustomerNotification[]>('/api/Customer/me/notifications')
  return data
}

export async function changeCustomerPassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    await api.post('/api/Customer/me/change-password', { currentPassword, newPassword })
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchCustomerDetail(id: number): Promise<CustomerDetail> {
  try {
    const { data } = await api.get<CustomerDetail>(`/api/Customer/${id}`)
    return {
      ...data,
      vehicles: data.vehicles ?? [],
      pendingCredits: data.pendingCredits ?? [],
    }
  } catch (e) {
    throw new Error(extractError(e))
  }
}

/** Staff panel: GET /api/Customer/{id} (use capital C — lowercase collides with history routes). */
export async function fetchCustomerPanel(id: number): Promise<CustomerDetail> {
  return fetchCustomerDetail(id)
}

export async function fetchPurchaseHistory(
  customerId: number,
  page = 1,
  pageSize = 5,
): Promise<PagedResult<PurchaseHistoryRecord>> {
  try {
    const { data } = await api.get(`/api/customer/${customerId}/purchase-history`, {
      params: { page, pageSize },
    })
    return mapPaged<PurchaseHistoryRecord>(data)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchServiceHistory(
  customerId: number,
  page = 1,
  pageSize = 5,
): Promise<PagedResult<ServiceHistoryRecord>> {
  try {
    const { data } = await api.get(`/api/customer/${customerId}/service-history`, {
      params: { page, pageSize },
    })
    return mapPaged<ServiceHistoryRecord>(data)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchCustomerAppointments(customerId: number): Promise<ServiceHistoryRecord[]> {
  try {
    const { data } = await api.get<ServiceHistoryRecord[]>(`/api/customer/${customerId}/appointments`)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchCustomerHistory(id: number): Promise<CustomerHistory> {
  try {
    const { data } = await api.get<CustomerHistory>(`/api/customer/${id}/history`)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function createCustomerWithVehicles(payload: {
  name: string
  email?: string
  phone: string
  address: string
  vehicles: VehicleInput[]
}): Promise<CustomerDetail> {
  try {
    const { data } = await api.post<CustomerDetail>('/api/Customer/with-vehicles', payload)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export type RegisterCustomerPayload = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  vehicle: {
    licensePlate: string
    make?: string
    model?: string
    year?: number
    vin?: string
  }
}

/** POST /api/customers/register */
export async function registerCustomer(payload: RegisterCustomerPayload): Promise<CustomerDetail> {
  try {
    const { data } = await api.post<CustomerDetail>('/api/customers/register', {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      vehicle: {
        licensePlate: payload.vehicle.licensePlate,
        make: payload.vehicle.make || undefined,
        model: payload.vehicle.model || undefined,
        year: payload.vehicle.year,
        vin: payload.vehicle.vin || undefined,
      },
    })
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function updateCustomerProfile(
  id: number,
  payload: { name: string; phone: string; address: string },
): Promise<CustomerDetail> {
  try {
    const { data } = await api.put<CustomerDetail>(`/api/Customer/${id}/profile`, payload)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function deleteCustomer(id: number): Promise<void> {
  try {
    await api.delete(`/api/Customer/${id}`)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchCustomerReports(): Promise<CustomerReports> {
  const { data } = await api.get<CustomerReports>('/api/customer/reports')
  return data
}

export async function fetchVehicles(customerId: number): Promise<Vehicle[]> {
  try {
    const { data } = await api.get<Vehicle[]>(`/api/customer/${customerId}/vehicles`)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function fetchVehicleNumberSuggestions(query?: string): Promise<string[]> {
  try {
    const { data } = await api.get<string[]>('/api/customer/vehicle-number-suggestions', {
      params: query?.trim() ? { q: query.trim() } : undefined,
    })
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function addVehicle(customerId: number, vehicle: VehicleInput): Promise<Vehicle> {
  try {
    const { data } = await api.post<Vehicle>(`/api/customer/${customerId}/vehicles`, vehicle)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function updateVehicle(
  customerId: number,
  vehicleId: number,
  vehicle: VehicleInput,
): Promise<Vehicle> {
  try {
    const { data } = await api.put<Vehicle>(`/api/customer/${customerId}/vehicles/${vehicleId}`, vehicle)
    return data
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function deleteVehicle(customerId: number, vehicleId: number): Promise<void> {
  try {
    await api.delete(`/api/customer/${customerId}/vehicles/${vehicleId}`)
  } catch (e) {
    throw new Error(extractError(e))
  }
}

export async function sendInvoiceEmail(saleId: number, email: string): Promise<void> {
  try {
    await api.post(`/api/Sales/${saleId}/send-invoice`, { email })
  } catch (e) {
    throw new Error(extractError(e))
  }
}
