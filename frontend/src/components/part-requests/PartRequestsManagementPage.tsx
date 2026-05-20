import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Loader2,
  Package,
  RefreshCw,
  Search,
  User,
  X,
} from 'lucide-react'
import {
  fetchAllPartRequests,
  fulfillPartRequest,
  rejectPartRequest,
  type PartRequest,
} from '../../services/partRequestApi'
import { useToast } from '../ui/ToastProvider'

const PAGE_SIZE = 9

type StatusFilter = 'all' | 'pending' | 'fulfilled' | 'rejected'

const STATUS_FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'fulfilled', label: 'Fulfilled' },
  { id: 'rejected', label: 'Rejected' },
]

function formatRequestDateShort(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function displayStatus(status: string): 'Pending' | 'Fulfilled' | 'Rejected' {
  const s = status.toLowerCase()
  if (s === 'fulfilled' || s === 'available') return 'Fulfilled'
  if (s === 'rejected') return 'Rejected'
  return 'Pending'
}

function statusBadgeClass(status: string) {
  const label = displayStatus(status)
  if (label === 'Fulfilled') return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
  if (label === 'Rejected') return 'bg-rose-100 text-rose-800 ring-rose-200'
  return 'bg-amber-100 text-amber-800 ring-amber-200'
}

function isTerminal(status: string) {
  const label = displayStatus(status)
  return label === 'Fulfilled' || label === 'Rejected'
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex justify-between">
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-4 w-20 rounded bg-slate-200" />
      </div>
      <div className="mb-3 h-6 w-3/4 rounded bg-slate-200" />
      <div className="mb-2 h-4 w-1/2 rounded bg-slate-200" />
      <div className="mb-4 h-16 rounded-lg bg-slate-100" />
      <div className="h-20 rounded-lg bg-slate-100" />
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 rounded-full bg-slate-200" />
        <div className="h-9 flex-1 rounded-full bg-slate-200" />
      </div>
    </div>
  )
}

function PartRequestCard({
  request,
  notes,
  onNotesChange,
  busy,
  onFulfill,
  onReject,
}: {
  request: PartRequest
  notes: string
  onNotesChange: (value: string) => void
  busy: boolean
  onFulfill: () => void
  onReject: () => void
}) {
  const terminal = isTerminal(request.status)
  const badge = displayStatus(request.status)
  const savedNotes = request.responseNotes?.trim()

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/30 ring-1 ring-slate-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${statusBadgeClass(request.status)}`}
        >
          {badge}
        </span>
        <span className="text-xs font-medium tabular-nums text-slate-500">
          {formatRequestDateShort(request.createdAt)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <h3 className="text-lg font-bold leading-tight text-slate-900">{request.partName}</h3>

        <p className="flex items-center gap-2 text-sm text-slate-600">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <User className="h-3.5 w-3.5" />
          </span>
          <span>
            <span className="font-semibold text-slate-700">Customer:</span> {request.customerName}
          </span>
        </p>

        {request.description ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
            <p className="text-sm leading-relaxed text-slate-700">&ldquo;{request.description}&rdquo;</p>
          </div>
        ) : null}

        {request.vehicleDetails ? (
          <p className="text-xs text-slate-500">{request.vehicleDetails}</p>
        ) : null}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Response notes
          </label>
          {terminal && savedNotes ? (
            <p className="mt-1.5 min-h-[5rem] rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-700">
              {savedNotes}
            </p>
          ) : (
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              disabled={busy || terminal}
              rows={4}
              placeholder="Response notes (e.g. Sourced from vendor X, arriving Friday)"
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-500"
            />
          )}
        </div>
      </div>

      {!terminal ? (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onFulfill}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 sm:flex-none sm:min-w-[120px]"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Fulfill
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:opacity-50 sm:flex-none sm:min-w-[120px]"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      ) : null}
    </article>
  )
}

export function PartRequestsManagementPage() {
  const { showToast } = useToast()
  const [rows, setRows] = useState<PartRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionId, setActionId] = useState<number | null>(null)
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAllPartRequests()
      setRows(data)
      setDraftNotes((prev) => {
        const next = { ...prev }
        data.forEach((r) => {
          if (next[r.id] === undefined) next[r.id] = r.responseNotes ?? ''
        })
        return next
      })
      setPage(1)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load part requests', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const label = displayStatus(r.status)
      if (statusFilter === 'pending' && label !== 'Pending') return false
      if (statusFilter === 'fulfilled' && label !== 'Fulfilled') return false
      if (statusFilter === 'rejected' && label !== 'Rejected') return false

      if (dateFilter) {
        const day = new Date(r.createdAt).toISOString().slice(0, 10)
        if (day !== dateFilter) return false
      }

      if (!q) return true
      return (
        r.customerName.toLowerCase().includes(q) ||
        r.partName.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        (r.vehicleDetails ?? '').toLowerCase().includes(q)
      )
    })
  }, [rows, statusFilter, dateFilter, search])

  const pendingCount = rows.filter((r) => displayStatus(r.status) === 'Pending').length
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function patchRequest(id: number, patch: Partial<PartRequest>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function handleFulfill(id: number) {
    const notes = (draftNotes[id] ?? '').trim()
    setActionId(id)
    patchRequest(id, { status: 'Fulfilled', responseNotes: notes || null })
    try {
      const updated = await fulfillPartRequest(id, notes || undefined)
      patchRequest(id, updated)
      showToast('Request fulfilled successfully', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not fulfill request', 'error')
      await load()
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(id: number) {
    const notes = (draftNotes[id] ?? '').trim()
    if (!window.confirm('Reject this part request?')) return
    setActionId(id)
    patchRequest(id, { status: 'Rejected', responseNotes: notes || null })
    try {
      const updated = await rejectPartRequest(id, notes || undefined)
      patchRequest(id, updated)
      showToast('Request rejected', 'error')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not reject request', 'error')
      await load()
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manage Part Requests</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Review and fulfill requests for unavailable parts from customers
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {pendingCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
              {pendingCount} Pending
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md shadow-slate-200/30 ring-1 ring-slate-100 sm:p-5">
        <h2 className="text-sm font-bold text-slate-900">Part Sourcing Dashboard</h2>
        <p className="mt-0.5 text-xs text-slate-500">Filter and search customer sourcing requests</p>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search by part or customer…"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            aria-label="Filter by date"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setStatusFilter(opt.id)
                setPage(1)
              }}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                statusFilter === opt.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <Package className="h-14 w-14 text-slate-300" />
          <p className="mt-4 text-sm font-semibold text-slate-800">
            {rows.length === 0 ? 'No part requests yet' : 'No requests match your filters'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Customer requests for unavailable parts will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((r) => (
              <PartRequestCard
                key={r.id}
                request={r}
                notes={draftNotes[r.id] ?? r.responseNotes ?? ''}
                onNotesChange={(value) => setDraftNotes((prev) => ({ ...prev, [r.id]: value }))}
                busy={actionId === r.id}
                onFulfill={() => void handleFulfill(r.id)}
                onReject={() => void handleReject(r.id)}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
