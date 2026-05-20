import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Loader2,
  Phone,
  Search,
  User,
  XCircle,
} from 'lucide-react'
import { saveAs } from 'file-saver'
import { useNavigate } from 'react-router-dom'
import { staffAppointmentDetailsPath } from '../../staff/staffRoutes'
import {
  downloadAppointmentsPdf,
  fetchAppointments,
  fetchServiceTypes,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentsSummary,
} from '../../services/appointmentApi'
import {
  backendStatusForAction,
  formatAppointmentDateTime,
  formatStatusLabel,
  serviceTypeBadgeClass,
  statusBadgeClass,
  statusBucket,
} from '../customer-portal/appointmentDisplay'
import { exportAppointmentsPdfClient } from '../../utils/appointmentsExportClient'
import { useToast } from '../ui/ToastProvider'

const PAGE_SIZE = 10

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
] as const

const DEFAULT_SERVICE_TYPES = [
  'Oil Replacement',
  'Oil change',
  'AC Service',
  'AC service',
  'Battery Replacement',
  'Battery check',
  'Transmission Service',
  'Exhaust Repair',
  'General service',
  'Brake inspection',
  'Diagnostics',
  'Tire rotation',
]

type SummaryCardProps = {
  label: string
  value: number
  Icon: typeof Clock
  pastel: string
  iconBg: string
  iconColor: string
  valueColor: string
  loading: boolean
}

function SummaryCard({
  label,
  value,
  Icon,
  pastel,
  iconBg,
  iconColor,
  valueColor,
  loading,
}: SummaryCardProps) {
  return (
    <div className={`rounded-2xl p-5 shadow-md ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${pastel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${valueColor}`}>
            {loading ? '—' : value.toLocaleString()}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </span>
      </div>
    </div>
  )
}

export function AppointmentsManagementPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [summary, setSummary] = useState<AppointmentsSummary>({
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  })
  const [rows, setRows] = useState<Appointment[]>([])
  const [serviceTypes, setServiceTypes] = useState<string[]>(DEFAULT_SERVICE_TYPES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const [draftStatus, setDraftStatus] = useState('')
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')
  const [draftService, setDraftService] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [activeFrom, setActiveFrom] = useState('')
  const [activeTo, setActiveTo] = useState('')
  const [activeService, setActiveService] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const filterParams = useMemo(
    () => ({
      status: activeStatus || undefined,
      fromDate: activeFrom || undefined,
      toDate: activeTo || undefined,
      serviceType: activeService || undefined,
      search: activeSearch.trim() || undefined,
    }),
    [activeStatus, activeFrom, activeTo, activeService, activeSearch],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAppointments(filterParams)
      setSummary(data.summary)
      setRows(data.items)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments')
      setRows([])
      setSummary({ pending: 0, confirmed: 0, cancelled: 0, completed: 0 })
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void fetchServiceTypes()
      .then((types) => {
        const merged = [...new Set([...DEFAULT_SERVICE_TYPES, ...types])].sort((a, b) =>
          a.localeCompare(b),
        )
        setServiceTypes(merged)
      })
      .catch(() => {
        /* keep defaults */
      })
  }, [])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  function handleApplyFilters() {
    setActiveStatus(draftStatus)
    setActiveFrom(draftFrom)
    setActiveTo(draftTo)
    setActiveService(draftService)
    setActiveSearch(draftSearch)
  }

  function handleReset() {
    setDraftStatus('')
    setDraftFrom('')
    setDraftTo('')
    setDraftService('')
    setDraftSearch('')
    setActiveStatus('')
    setActiveFrom('')
    setActiveTo('')
    setActiveService('')
    setActiveSearch('')
  }

  async function handleStatusAction(id: number, action: 'confirm' | 'cancel' | 'complete') {
    const status = backendStatusForAction(action)
    setActionId(id)
    try {
      await updateAppointmentStatus(id, status)
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      showToast(`Appointment ${formatStatusLabel(status).toLowerCase()}.`, 'success')
      const data = await fetchAppointments(filterParams)
      setSummary(data.summary)
      setRows(data.items)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error')
    } finally {
      setActionId(null)
    }
  }

  async function handleDownloadPdf() {
    if (rows.length === 0 && !loading) {
      showToast('No appointments to export for the current filters', 'error')
      return
    }
    setExportingPdf(true)
    try {
      const report = { summary, items: rows }
      try {
        const { fileName, blob } = await downloadAppointmentsPdf(filterParams)
        saveAs(blob, fileName)
      } catch {
        exportAppointmentsPdfClient(report, activeFrom, activeTo)
      }
      showToast('PDF report downloaded successfully', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'PDF export failed', 'error')
    } finally {
      setExportingPdf(false)
    }
  }

  function canConfirm(row: Appointment) {
    return statusBucket(row.status) === 'pending'
  }

  function canCancel(row: Appointment) {
    const b = statusBucket(row.status)
    return b === 'pending' || b === 'confirmed'
  }

  function canComplete(row: Appointment) {
    const b = statusBucket(row.status)
    return b === 'pending' || b === 'confirmed'
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            <CalendarDays className="h-7 w-7 text-blue-600" />
            Manage Appointments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review workshop bookings, update statuses, and contact customers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownloadPdf()}
          disabled={exportingPdf || loading || rows.length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md disabled:translate-y-0 disabled:opacity-50"
        >
          {exportingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          Download PDF
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Pending Appointments"
          value={summary.pending}
          Icon={Clock}
          pastel="bg-amber-50/90 ring-amber-100"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          valueColor="text-amber-900"
          loading={loading}
        />
        <SummaryCard
          label="Confirmed Appointments"
          value={summary.confirmed}
          Icon={CheckCircle2}
          pastel="bg-blue-50/90 ring-blue-100"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          valueColor="text-blue-900"
          loading={loading}
        />
        <SummaryCard
          label="Cancelled Appointments"
          value={summary.cancelled}
          Icon={XCircle}
          pastel="bg-rose-50/90 ring-rose-100"
          iconBg="bg-rose-100"
          iconColor="text-rose-600"
          valueColor="text-rose-900"
          loading={loading}
        />
        <SummaryCard
          label="Completed Appointments"
          value={summary.completed}
          Icon={BadgeCheck}
          pastel="bg-emerald-50/90 ring-emerald-100"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          valueColor="text-emerald-900"
          loading={loading}
        />
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/40 ring-1 ring-slate-100">
        <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-blue-50 to-sky-50 px-5 py-3.5 sm:px-6">
          <h2 className="text-sm font-bold text-slate-900">Appointment filters</h2>
          <p className="text-xs text-slate-600">Refine by status, date range, or service type</p>
        </div>
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyFilters()
                }}
                placeholder="Search customer, phone, vehicle, service…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </span>
                <select
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  From Date
                </span>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  To Date
                </span>
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Service Type
                </span>
                <select
                  value={draftService}
                  onChange={(e) => setDraftService(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All services</option>
                  {serviceTypes.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={loading || exportingPdf}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading || exportingPdf}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mx-5 my-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-6">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading appointments…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <CalendarClock className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No appointments found</p>
            <p className="mt-1 text-sm text-slate-500">
              Adjust filters or reset to view all workshop bookings.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Date &amp; Time</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Vehicle</th>
                    <th className="px-4 py-3.5">Service Type</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((row) => {
                    const { dateLabel, timeRange } = formatAppointmentDateTime(row.date)
                    const busy = actionId === row.id
                    return (
                      <tr key={row.id} className="transition-colors hover:bg-blue-50/30">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <CalendarClock className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">{dateLabel}</p>
                              <p className="text-xs text-slate-500">{timeRange}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <User className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="font-semibold text-slate-900">{row.customerName}</p>
                              <p className="flex items-center gap-1 text-xs text-slate-500">
                                <Phone className="h-3 w-3" />
                                {row.customerPhone || '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-900">{row.vehicleMakeModel || '—'}</p>
                          <p className="text-xs text-slate-500">{row.vehicleNumber || '—'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${serviceTypeBadgeClass(row.serviceType)}`}
                          >
                            {row.serviceType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ring-inset ${statusBadgeClass(row.status)}`}
                          >
                            {formatStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(staffAppointmentDetailsPath(row.id))}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </button>
                            {canConfirm(row) ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleStatusAction(row.id, 'confirm')}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                            ) : null}
                            {canCancel(row) ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleStatusAction(row.id, 'cancel')}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            ) : null}
                            {canComplete(row) ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleStatusAction(row.id, 'complete')}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                              >
                                Complete
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:px-6">
              <p className="text-xs text-slate-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of{' '}
                {rows.length} appointments
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="px-3 text-xs font-semibold tabular-nums text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {null ? (
        <AppointmentDetailModal
          appointment={rows[0]!}
          busy={false}
          onClose={() => undefined}
          onConfirm={() => undefined}
          onCancel={() => undefined}
          onComplete={() => undefined}
          canConfirm={false}
          canCancel={false}
          canComplete={false}
        />
      ) : null}
    </div>
  )
}

function AppointmentDetailModal({
  appointment,
  busy,
  onClose,
  onConfirm,
  onCancel,
  onComplete,
  canConfirm,
  canCancel,
  canComplete,
}: {
  appointment: Appointment
  busy: boolean
  onClose: () => void
  onConfirm: () => void
  onCancel: () => void
  onComplete: () => void
  canConfirm: boolean
  canCancel: boolean
  canComplete: boolean
}) {
  const { dateLabel, timeRange } = formatAppointmentDateTime(appointment.date)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-900">Appointment Details</h2>
        <p className="mt-0.5 text-sm text-slate-500">#{appointment.id}</p>

        <div className="mt-5 space-y-4">
          <DetailBlock label="Customer" value={appointment.customerName} />
          <DetailBlock label="Phone" value={appointment.customerPhone || '—'} />
          <DetailBlock
            label="Vehicle"
            value={`${appointment.vehicleMakeModel || '—'} · ${appointment.vehicleNumber || '—'}`}
          />
          <DetailBlock label="Date" value={dateLabel} />
          <DetailBlock label="Time" value={timeRange} />
          <DetailBlock label="Service" value={appointment.serviceType} />
          <DetailBlock label="Estimated cost" value={formatMoney(appointment.estimatedCost)} />
          <DetailBlock label="Notes" value={appointment.notes?.trim() || '—'} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase ring-1 ring-inset ${statusBadgeClass(appointment.status)}`}
            >
              {formatStatusLabel(appointment.status)}
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {canConfirm ? (
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Confirm
            </button>
          ) : null}
          {canComplete ? (
            <button
              type="button"
              disabled={busy}
              onClick={onComplete}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Complete
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}
