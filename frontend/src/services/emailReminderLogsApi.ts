import { api } from '../lib/apiClient'

export type EmailReminderLog = {
  id: number
  customerId: number
  customerName: string
  creditPaymentId: number
  invoiceNumber: string
  email: string
  paymentAmount: number
  dueDate: string | null
  sentAt: string
  status: string
  errorMessage: string | null
}

export type EmailReminderLogsPage = {
  items: EmailReminderLog[]
  totalCount: number
  page: number
  pageSize: number
}

function mapLog(raw: Record<string, unknown>): EmailReminderLog {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    customerId: Number(raw.customerId ?? raw.CustomerId ?? 0),
    customerName: String(raw.customerName ?? raw.CustomerName ?? ''),
    creditPaymentId: Number(raw.creditPaymentId ?? raw.CreditPaymentId ?? 0),
    invoiceNumber: String(raw.invoiceNumber ?? raw.InvoiceNumber ?? ''),
    email: String(raw.email ?? raw.Email ?? ''),
    paymentAmount: Number(raw.paymentAmount ?? raw.PaymentAmount ?? 0),
    dueDate: (raw.dueDate ?? raw.DueDate) != null ? String(raw.dueDate ?? raw.DueDate) : null,
    sentAt: String(raw.sentAt ?? raw.SentAt ?? ''),
    status: String(raw.status ?? raw.Status ?? ''),
    errorMessage: (raw.errorMessage ?? raw.ErrorMessage) != null
      ? String(raw.errorMessage ?? raw.ErrorMessage)
      : null,
  }
}

function mapPage(raw: Record<string, unknown>): EmailReminderLogsPage {
  const items = Array.isArray(raw.items ?? raw.Items)
    ? (raw.items ?? raw.Items) as Record<string, unknown>[]
    : []
  return {
    items: items.map(mapLog),
    totalCount: Number(raw.totalCount ?? raw.TotalCount ?? 0),
    page: Number(raw.page ?? raw.Page ?? 1),
    pageSize: Number(raw.pageSize ?? raw.PageSize ?? 10),
  }
}

export async function fetchEmailReminderLogs(params: {
  search?: string
  page?: number
  pageSize?: number
}): Promise<EmailReminderLogsPage> {
  const { data } = await api.get<Record<string, unknown>>('/api/admin/email-reminder-logs', {
    params: {
      search: params.search || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 10,
    },
  })
  return mapPage(data)
}

export async function testSmtpConnection(): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success?: boolean; message?: string; Success?: boolean; Message?: string }>(
    '/api/admin/email-reminder-logs/test-smtp',
  )
  return {
    success: Boolean(data.success ?? data.Success),
    message: String(data.message ?? data.Message ?? ''),
  }
}

export async function runOverduePaymentCheck(): Promise<{ success: boolean; message: string; emailsSent: number }> {
  const { data } = await api.post<{
    success?: boolean
    message?: string
    emailsSent?: number
    Success?: boolean
    Message?: string
    EmailsSent?: number
  }>('/api/admin/email-reminder-logs/run-overdue-check')
  return {
    success: Boolean(data.success ?? data.Success),
    message: String(data.message ?? data.Message ?? ''),
    emailsSent: Number(data.emailsSent ?? data.EmailsSent ?? 0),
  }
}

export async function sendTestReminder(invoiceId: number): Promise<string> {
  const { data } = await api.post<{ message?: string; Message?: string }>(
    '/api/admin/email-reminder-logs/send-test',
    { invoiceId },
  )
  return String(data.message ?? data.Message ?? 'Reminder sent.')
}
