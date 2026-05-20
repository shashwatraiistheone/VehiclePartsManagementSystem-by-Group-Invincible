import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Request failed.')
}

export type SaleInvoice = {
  id: number
  invoiceNumber: string
  createdDate: string
  dueDate: string
  paymentStatus: string
  paidAmount: number
  balanceAmount: number
  isPaid: boolean
}

export type SaleRecord = {
  id: number
  customerId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  date: string
  totalAmount: number
  discount: number
  finalAmount: number
  items: {
    partId: number
    partName: string
    quantity: number
    price: number
    lineTotal: number
  }[]
  invoiceId: number
  invoiceNumber: string
  invoiceCreatedDate: string
  invoice: SaleInvoice | null
}

export type CompanySettings = {
  name: string
  address: string
  phone: string
  email: string
}

export type CreateSalePayload = {
  customerId: number
  items: { partId: number; quantity: number }[]
  paymentStatus?: 'Paid' | 'Credit'
}

function mapSale(raw: Record<string, unknown>): SaleRecord {
  const invRaw = (raw.invoice ?? raw.Invoice) as Record<string, unknown> | null | undefined
  const invoice: SaleInvoice | null = invRaw
    ? {
        id: Number(invRaw.id ?? invRaw.Id ?? 0),
        invoiceNumber: String(invRaw.invoiceNumber ?? invRaw.InvoiceNumber ?? ''),
        createdDate: String(invRaw.createdDate ?? invRaw.CreatedDate ?? ''),
        dueDate: String(invRaw.dueDate ?? invRaw.DueDate ?? ''),
        paymentStatus: String(invRaw.paymentStatus ?? invRaw.PaymentStatus ?? ''),
        paidAmount: Number(invRaw.paidAmount ?? invRaw.PaidAmount ?? 0),
        balanceAmount: Number(invRaw.balanceAmount ?? invRaw.BalanceAmount ?? 0),
        isPaid: Boolean(invRaw.isPaid ?? invRaw.IsPaid ?? false),
      }
    : null

  const itemsRaw = (raw.items ?? raw.Items ?? []) as Record<string, unknown>[]

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    customerEmail: String(raw.customerEmail ?? raw.CustomerEmail ?? ''),
    customerPhone: String(raw.customerPhone ?? raw.CustomerPhone ?? ''),
    customerAddress: String(raw.customerAddress ?? raw.CustomerAddress ?? ''),
    date: String(raw.date ?? raw.Date ?? ''),
    totalAmount: Number(raw.totalAmount ?? raw.TotalAmount ?? 0),
    discount: Number(raw.discount ?? raw.Discount ?? 0),
    finalAmount: Number(raw.finalAmount ?? raw.FinalAmount ?? 0),
    items: itemsRaw.map((i) => ({
      partId: Number(i.partId ?? i.PartId ?? 0),
      partName: String(i.partName ?? i.PartName ?? ''),
      quantity: Number(i.quantity ?? i.Quantity ?? 0),
      price: Number(i.price ?? i.Price ?? 0),
      lineTotal: Number(i.lineTotal ?? i.LineTotal ?? 0),
    })),
    invoiceId: Number(raw.invoiceId ?? raw.InvoiceId ?? invoice?.id ?? 0),
    invoiceNumber: String(raw.invoiceNumber ?? raw.InvoiceNumber ?? invoice?.invoiceNumber ?? ''),
    invoiceCreatedDate: String(raw.invoiceCreatedDate ?? raw.InvoiceCreatedDate ?? invoice?.createdDate ?? ''),
    invoice,
  }
}

export async function fetchSales(): Promise<SaleRecord[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>('/api/sales')
    return data.map(mapSale)
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function fetchSaleById(id: number): Promise<SaleRecord> {
  try {
    const { data } = await api.get<Record<string, unknown>>(`/api/sales/${id}`)
    return mapSale(data)
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function createSale(payload: CreateSalePayload): Promise<SaleRecord> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/sales', payload)
    return mapSale(data)
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function sendInvoiceEmail(saleId: number, email: string): Promise<void> {
  try {
    await api.post(`/api/sales/${saleId}/send-invoice`, { email })
  } catch (error) {
    throw new Error(extractError(error))
  }
}

export async function fetchCompanySettings(): Promise<CompanySettings> {
  try {
    const { data } = await api.get<Record<string, unknown>>('/api/settings/company')
    return {
      name: String(data.name ?? data.Name ?? ''),
      address: String(data.address ?? data.Address ?? ''),
      phone: String(data.phone ?? data.Phone ?? ''),
      email: String(data.email ?? data.Email ?? ''),
    }
  } catch (error) {
    throw new Error(extractError(error))
  }
}
