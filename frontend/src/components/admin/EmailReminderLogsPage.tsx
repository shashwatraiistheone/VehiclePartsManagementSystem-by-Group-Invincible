import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Play,
  RefreshCw,
  Search,
  Send,
  Wifi,
} from 'lucide-react'
import {
  fetchEmailReminderLogs,
  runOverduePaymentCheck,
  sendTestReminder,
  testSmtpConnection,
  type EmailReminderLog,
} from '../../services/emailReminderLogsApi'
import { formatUsd } from '../../utils/formatUsd'

type Props = {
  onBack?: () => void
}

const PAGE_SIZE = 10

function formatDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const isSent = normalized === 'sent'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        isSent
          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
          : 'bg-rose-50 text-rose-800 ring-rose-200/80'
      }`}
    >
      {status}
    </span>
  )
}

export function EmailReminderLogsPage({ onBack }: Props) {
  const [logs, setLogs] = useState<EmailReminderLog[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [testInvoiceId, setTestInvoiceId] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [search])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchEmailReminderLogs({
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      setLogs(result.items)
      setTotalCount(result.totalCount)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load email reminder logs.')
      setLogs([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const pageLabel = useMemo(() => {
    if (totalCount === 0) return 'No records'
    const start = (page - 1) * PAGE_SIZE + 1
    const end = Math.min(page * PAGE_SIZE, totalCount)
    return `${start}–${end} of ${totalCount}`
  }, [page, totalCount])

  async function handleTestSmtp() {
    setActionLoading('smtp')
    setError(null)
    setSuccess(null)
    try {
      const result = await testSmtpConnection()
      if (result.success) {
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SMTP test failed.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRunOverdue() {
    setActionLoading('overdue')
    setError(null)
    setSuccess(null)
    try {
      const result = await runOverduePaymentCheck()
      setSuccess(result.message)
      await loadLogs()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Overdue check failed.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSendTest() {
    const id = Number(testInvoiceId)
    if (!id || id <= 0) {
      setError('Enter a valid credit invoice id to send a test reminder.')
      return
    }
    setActionLoading('test')
    setError(null)
    setSuccess(null)
    try {
      const msg = await sendTestReminder(id)
      setSuccess(msg)
      await loadLogs()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send test reminder.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Reminder Logs</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                See which customer was emailed, for which invoice (serial number), and when.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Testing &amp; manual triggers</h2>
        <p className="mt-1 text-xs text-slate-500">
          Verify SMTP, simulate the overdue job, or send a manual reminder for a credit invoice.
        </p>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
          <button
            type="button"
            onClick={() => void handleTestSmtp()}
            disabled={actionLoading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {actionLoading === 'smtp' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="h-4 w-4" />
            )}
            Test SMTP
          </button>
          <button
            type="button"
            onClick={() => void handleRunOverdue()}
            disabled={actionLoading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {actionLoading === 'overdue' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run overdue check
          </button>
          <div className="flex flex-1 flex-col gap-1 sm:min-w-[220px] sm:max-w-xs">
            <label htmlFor="test-invoice-id" className="text-xs font-medium text-slate-600">
              Credit invoice id (database id, not serial #)
            </label>
            <input
              id="test-invoice-id"
              type="number"
              min={1}
              value={testInvoiceId}
              onChange={(e) => setTestInvoiceId(e.target.value)}
              placeholder="e.g. 12"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSendTest()}
            disabled={actionLoading !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 transition hover:bg-blue-100 disabled:opacity-60"
          >
            {actionLoading === 'test' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send test email
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #, customer, email, or status…"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <p className="text-xs text-slate-500">{pageLabel}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm">Loading reminder logs…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Mail className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No reminder emails yet</p>
            <p className="max-w-sm text-xs text-slate-500">
              Each row will show customer name, invoice serial number, email address, amount, and sent/failed status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Invoice #</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Sent to</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Amount due</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Sent at</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-900">
                      {log.invoiceNumber || `INV-${log.creditPaymentId}`}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{log.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{log.email}</td>
                    <td className="px-4 py-3 text-slate-700">{formatUsd(log.paymentAmount)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(log.sentAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                      {log.errorMessage && (
                        <p className="mt-1 max-w-xs truncate text-xs text-rose-600" title={log.errorMessage}>
                          {log.errorMessage}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
