import { useEffect, useState } from 'react'
import { Loader2, Mail, X } from 'lucide-react'
import { fetchCreditEmailLogs, type CreditEmailLog } from '../../../services/creditApi'

type Props = {
  invoiceId: number
  invoiceNumber: string
  customerName: string
  onClose: () => void
}

function formatSentAt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusClass(status: string) {
  return status.toLowerCase() === 'sent'
    ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
    : 'bg-rose-50 text-rose-800 ring-rose-200'
}

export function CreditReminderHistoryModal({
  invoiceId,
  invoiceNumber,
  customerName,
  onClose,
}: Props) {
  const [logs, setLogs] = useState<CreditEmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchCreditEmailLogs(invoiceId)
        if (!cancelled) setLogs(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reminder history')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [invoiceId])

  const Box = 'div' as const

  return (
    <Box className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Box className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
          <Box className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <Mail className="h-4 w-4" aria-hidden />
            </span>
            <Box>
              <h2 className="text-base font-bold">Reminder history</h2>
              <p className="text-xs text-blue-100">
                {invoiceNumber} · {customerName}
              </p>
            </Box>
          </Box>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/15"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <Box className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <Box className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-slate-500">Loading history…</p>
            </Box>
          ) : error ? (
            <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">No reminder emails sent yet.</p>
          ) : (
            <ul className="space-y-3">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 shadow-sm"
                >
                  <Box className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{log.emailTypeLabel}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${statusClass(log.status)}`}
                    >
                      {log.status}
                    </span>
                  </Box>
                  <p className="mt-1 text-xs text-slate-500">{formatSentAt(log.sentAt)}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {log.isAutomatic ? 'Automatic' : 'Manual'} send
                  </p>
                  {log.errorMessage ? (
                    <p className="mt-2 text-xs text-rose-600">{log.errorMessage}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Box>
      </Box>
    </Box>
  )
}
