import axios from 'axios'
import { api, extractApiErrorMessage } from '../lib/apiClient'

function extractError(error: unknown): string {
  return extractApiErrorMessage(error, 'Failed to load credit data.')
}

function isAxiosNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

function computeTotalReceivables(items: CreditInvoice[]): number {
  return items
    .filter((inv) => inv.balanceDue > 0 && inv.status.toLowerCase() !== 'paid')
    .reduce((sum, inv) => sum + inv.balanceDue, 0)
}

/** Map legacy GET /api/invoices rows to the credit UI shape. */
function mapInvoiceFromLegacy(raw: Record<string, unknown>): CreditInvoice {
  const sale = (raw.sale ?? raw.Sale) as Record<string, unknown> | undefined
  const customer = (sale?.customer ?? sale?.Customer) as Record<string, unknown> | undefined
  const balanceDue = Number(raw.balanceAmount ?? raw.BalanceAmount ?? 0)
  const paidAmount = Number(raw.paidAmount ?? raw.PaidAmount ?? 0)
  const isPaid = Boolean(raw.isPaid ?? raw.IsPaid) || balanceDue <= 0
  const invoiceDate = String(raw.createdDate ?? raw.CreatedDate ?? '')
  const dueDateRaw = raw.dueDate ?? raw.DueDate
  const dueDate = dueDateRaw ? String(dueDateRaw) : invoiceDate
  const due = new Date(dueDate || Date.now())
  const overdueDays =
    !isPaid && balanceDue > 0
      ? Math.max(0, Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
  const totalAmount = Number(sale?.totalAmount ?? sale?.TotalAmount ?? 0)

  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    invoiceNumber: String(raw.invoiceNumber ?? raw.InvoiceNumber ?? ''),
    invoiceDate,
    dueDate,
    customerId: Number(customer?.id ?? customer?.Id ?? 0),
    customerName: String(customer?.name ?? customer?.Name ?? 'Unknown'),
    customerEmail: String(customer?.email ?? customer?.Email ?? ''),
    originalAmount: totalAmount > 0 ? totalAmount : balanceDue + paidAmount,
    balanceDue,
    paidAmount,
    status: String(
      raw.paymentStatus ?? raw.PaymentStatus ?? (isPaid ? 'Paid' : balanceDue > 0 ? 'Credit' : 'Paid'),
    ),
    overdueDays,
    reminderSentCount: Number(raw.reminderSentCount ?? raw.ReminderSentCount ?? 0),
    lastReminderDate: (raw.lastReminderDate ?? raw.LastReminderDate) as string | null | undefined,
  }
}

async function fetchLegacyInvoices(): Promise<CreditListResponse> {
  const { data } = await api.get<Record<string, unknown>[]>('/api/invoices')
  const items = data.map(mapInvoiceFromLegacy)
  return { totalReceivables: computeTotalReceivables(items), items }
}

export type CreditInvoice = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  customerId: number
  customerName: string
  customerEmail: string
  originalAmount: number
  balanceDue: number
  paidAmount: number
  status: string
  overdueDays: number
  reminderSentCount: number
  lastReminderDate?: string | null
}

export type CreditListResponse = {
  totalReceivables: number
  items: CreditInvoice[]
}

export const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'eSewa', 'Khalti'] as const

function mapInvoice(raw: Record<string, unknown>): CreditInvoice {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    invoiceNumber: String(raw.invoiceNumber ?? raw.InvoiceNumber ?? ''),
    invoiceDate: String(raw.invoiceDate ?? raw.InvoiceDate ?? ''),
    dueDate: String(raw.dueDate ?? raw.DueDate ?? ''),
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    customerEmail: String(raw.customerEmail ?? raw.CustomerEmail ?? ''),
    originalAmount: Number(raw.originalAmount ?? raw.OriginalAmount ?? 0),
    balanceDue: Number(raw.balanceDue ?? raw.BalanceDue ?? 0),
    paidAmount: Number(raw.paidAmount ?? raw.PaidAmount ?? 0),
    status: String(raw.status ?? raw.Status ?? ''),
    overdueDays: Number(raw.overdueDays ?? raw.OverdueDays ?? 0),
    reminderSentCount: Number(raw.reminderSentCount ?? raw.ReminderSentCount ?? 0),
    lastReminderDate: (raw.lastReminderDate ?? raw.LastReminderDate) as string | null | undefined,
  }
}

export async function fetchCreditInvoices(): Promise<CreditListResponse> {
  try {
    const { data } = await api.get<{
      totalReceivables?: number
      TotalReceivables?: number
      items?: Record<string, unknown>[]
      Items?: Record<string, unknown>[]
    }>('/api/credit')

    const items = (data.items ?? data.Items ?? []).map(mapInvoice)
    return {
      totalReceivables: Number(data.totalReceivables ?? data.TotalReceivables ?? 0),
      items,
    }
  } catch (e) {
    if (isAxiosNotFound(e)) {
      try {
        return await fetchLegacyInvoices()
      } catch (legacyErr) {
        throw new Error(extractError(legacyErr))
      }
    }
    throw new Error(extractError(e))
  }
}

export async function fetchCreditInvoice(id: number): Promise<CreditInvoice> {
  try {
    const { data } = await api.get<Record<string, unknown>>(`/api/credit/${id}`)
    return mapInvoice(data)
  } catch (e) {
    if (isAxiosNotFound(e)) {
      const list = await fetchLegacyInvoices()
      const found = list.items.find((inv) => inv.id === id)
      if (found) return found
      throw new Error('Invoice not found.')
    }
    throw new Error(extractError(e))
  }
}

export type CreditPaymentHistory = {
  id: number
  invoiceId: number
  amountPaid: number
  remainingBalanceAfter: number
  paymentMethod: string
  notes?: string | null
  paymentDate: string
  status: string
  staffId?: number | null
  staffMember?: string | null
}

export type CreditPaymentResult = {
  success: boolean
  message: string
  paidAmount: number
  remainingBalance: number
  status: string
  totalReceivables: number
  invoice: CreditInvoice
  receipt: CreditPaymentReceipt
}

/** Passed via react-router state after recording a payment on the collect page. */
export type CreditPaymentSuccessState = {
  paidAmount: number
  remainingBalance: number
  status: string
  totalReceivables: number
  invoice: CreditInvoice
}

export type CreditPaymentReceipt = {
  paymentId: number
  invoiceNumber: string
  customerName: string
  amountPaid: number
  remainingBalance: number
  totalAmount: number
  paymentMethod: string
  status: string
  paymentDate: string
}

function mapPaymentHistory(raw: Record<string, unknown>): CreditPaymentHistory {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    invoiceId: Number(raw.invoiceId ?? raw.InvoiceId ?? 0),
    amountPaid: Number(raw.amountPaid ?? raw.AmountPaid ?? 0),
    remainingBalanceAfter: Number(raw.remainingBalanceAfter ?? raw.RemainingBalanceAfter ?? 0),
    paymentMethod: String(raw.paymentMethod ?? raw.PaymentMethod ?? ''),
    notes: (raw.notes ?? raw.Notes) as string | null | undefined,
    paymentDate: String(raw.paymentDate ?? raw.PaymentDate ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    staffId: (raw.staffId ?? raw.StaffId) as number | null | undefined,
    staffMember: (raw.staffMember ?? raw.StaffMember) as string | null | undefined,
  }
}

function mapReceipt(raw: Record<string, unknown>): CreditPaymentReceipt {
  return {
    paymentId: Number(raw.paymentId ?? raw.PaymentId ?? 0),
    invoiceNumber: String(raw.invoiceNumber ?? raw.InvoiceNumber ?? ''),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    amountPaid: Number(raw.amountPaid ?? raw.AmountPaid ?? 0),
    remainingBalance: Number(raw.remainingBalance ?? raw.RemainingBalance ?? 0),
    totalAmount: Number(raw.totalAmount ?? raw.TotalAmount ?? 0),
    paymentMethod: String(raw.paymentMethod ?? raw.PaymentMethod ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    paymentDate: String(raw.paymentDate ?? raw.PaymentDate ?? ''),
  }
}

export async function fetchCreditPaymentHistory(invoiceId: number): Promise<CreditPaymentHistory[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>(`/api/credit/history/${invoiceId}`)
    return data.map((row) => mapPaymentHistory(row))
  } catch (e) {
    if (isAxiosNotFound(e)) return []
    throw new Error(extractError(e))
  }
}

export async function submitCreditPayment(payload: {
  invoiceId: number
  amount: number
  paymentMethod: string
  notes?: string
}): Promise<CreditPaymentResult> {
  try {
    const { data } = await api.post<Record<string, unknown>>('/api/credit/payment', payload)
    const invoiceRaw = (data.invoice ?? data.Invoice) as Record<string, unknown>
    const receiptRaw = (data.receipt ?? data.Receipt) as Record<string, unknown>
    return {
      success: Boolean(data.success ?? data.Success ?? true),
      message: String(data.message ?? data.Message ?? 'Payment recorded successfully.'),
      paidAmount: Number(data.paidAmount ?? data.PaidAmount ?? receiptRaw.amountPaid ?? 0),
      remainingBalance: Number(
        data.remainingBalance ?? data.RemainingBalance ?? receiptRaw.remainingBalance ?? 0,
      ),
      status: String(data.status ?? data.Status ?? receiptRaw.status ?? ''),
      totalReceivables: Number(data.totalReceivables ?? data.TotalReceivables ?? 0),
      invoice: mapInvoice(invoiceRaw),
      receipt: mapReceipt(receiptRaw),
    }
  } catch (e) {
    if (!isAxiosNotFound(e)) throw new Error(extractError(e))

    const before = await fetchCreditInvoice(payload.invoiceId)
    const { data } = await api.post<Record<string, unknown>>(
      `/api/invoices/${payload.invoiceId}/payment`,
      { amount: payload.amount },
    )
    const invoice = await fetchCreditInvoice(payload.invoiceId)
    const list = await fetchCreditInvoices()
    const remainingBalance = Number(data.balanceAmount ?? data.BalanceAmount ?? invoice.balanceDue)
    const status = String(data.paymentStatus ?? data.PaymentStatus ?? invoice.status)

    return {
      success: true,
      message: String(data.message ?? data.Message ?? 'Payment recorded successfully.'),
      paidAmount: payload.amount,
      remainingBalance,
      status,
      totalReceivables: list.totalReceivables,
      invoice,
      receipt: {
        paymentId: 0,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        amountPaid: payload.amount,
        remainingBalance,
        totalAmount: before.originalAmount,
        paymentMethod: payload.paymentMethod,
        status,
        paymentDate: new Date().toISOString(),
      },
    }
  }
}

/** @deprecated Use submitCreditPayment */
export async function payCreditInvoice(payload: {
  invoiceId: number
  amount: number
  paymentMethod: string
  notes?: string
}): Promise<{ message: string; invoice: CreditInvoice }> {
  const res = await submitCreditPayment(payload)
  return { message: res.message, invoice: res.invoice }
}

export type CreditEmailLog = {
  id: number
  customerId: number
  invoiceId: number
  emailType: string
  emailTypeLabel: string
  sentAt: string
  status: string
  isAutomatic: boolean
  errorMessage?: string | null
}

function mapEmailLog(raw: Record<string, unknown>): CreditEmailLog {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    invoiceId: Number(raw.invoiceId ?? raw.InvoiceId ?? 0),
    emailType: String(raw.emailType ?? raw.EmailType ?? ''),
    emailTypeLabel: String(raw.emailTypeLabel ?? raw.EmailTypeLabel ?? raw.emailType ?? ''),
    sentAt: String(raw.sentAt ?? raw.SentAt ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    isAutomatic: Boolean(raw.isAutomatic ?? raw.IsAutomatic ?? false),
    errorMessage: (raw.errorMessage ?? raw.ErrorMessage) as string | null | undefined,
  }
}

export async function fetchCreditEmailLogs(invoiceId: number): Promise<CreditEmailLog[]> {
  try {
    const { data } = await api.get<Record<string, unknown>[]>(`/api/credit/${invoiceId}/email-logs`)
    return data.map((row) => mapEmailLog(row))
  } catch (e) {
    if (isAxiosNotFound(e)) {
      const invoice = await fetchCreditInvoice(invoiceId).catch(() => null)
      if (invoice?.lastReminderDate) {
        return [
          {
            id: 0,
            customerId: invoice.customerId,
            invoiceId,
            emailType: 'reminder',
            emailTypeLabel: 'Payment reminder',
            sentAt: invoice.lastReminderDate,
            status: 'Sent',
            isAutomatic: false,
          },
        ]
      }
      return []
    }
    throw new Error(extractError(e))
  }
}

export async function sendCreditReminder(invoiceId: number): Promise<string> {
  try {
    const { data } = await api.post<{ message: string }>('/api/credit/remind', { invoiceId })
    return data.message
  } catch (e) {
    if (isAxiosNotFound(e)) {
      const { data } = await api.post<{ message: string }>(
        `/api/invoices/${invoiceId}/send-reminder`,
      )
      return data.message
    }
    throw new Error(extractError(e))
  }
}
