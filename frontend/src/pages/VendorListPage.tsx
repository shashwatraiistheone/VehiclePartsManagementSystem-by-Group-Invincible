import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react'
import { DeleteVendorDialog } from '../components/admin/DeleteVendorDialog'
import { VendorDeactivateDialog } from '../components/admin/VendorDeactivateDialog'
import { VendorFormModal } from '../components/admin/VendorFormModal'
import { VendorViewModal } from '../components/admin/VendorViewModal'
import {
  deactivateVendor,
  deleteVendor,
  fetchVendors,
  updateVendor,
  type UpdateVendorPayload,
  type Vendor,
} from '../services/vendorApi'
import { ApiErrorAlert } from '../components/ui/ApiErrorAlert'
import { extractApiErrorMessage } from '../lib/apiClient'
import { formatMoney } from '../utils/formatUsd'

const PAGE_SIZES = [10, 25, 50, 100] as const

type Toast = { message: string; type: 'success' | 'error' }

type Props = {
  onBack?: () => void
  onNavigateCreate?: () => void
  showCreatedToast?: boolean
  onDismissCreatedToast?: () => void
}

export default function VendorListPage({
  onBack,
  onNavigateCreate,
  showCreatedToast,
  onDismissCreatedToast,
}: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [modalMode, setModalMode] = useState<'edit' | null>(null)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [viewing, setViewing] = useState<Vendor | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Vendor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null)

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const loadVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchVendors()
      setVendors(rows)
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Failed to load vendors.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVendors()
  }, [loadVendors])

  useEffect(() => {
    if (!showCreatedToast) return
    showToast('Vendor created successfully.')
    onDismissCreatedToast?.()
  }, [showCreatedToast, showToast, onDismissCreatedToast])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vendors
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.phone.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q),
    )
  }, [vendors, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, start + maxVisible - 1)
    start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [safePage, totalPages])

  async function handleSubmit(payload: UpdateVendorPayload) {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        await updateVendor(editing.id, payload)
        showToast('Vendor updated successfully.')
      }
      setModalMode(null)
      setEditing(null)
      await loadVendors()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return
    setDeactivating(true)
    setError(null)
    try {
      await deactivateVendor(deactivateTarget.id, deactivateTarget)
      showToast(`${deactivateTarget.name} deactivated.`)
      setDeactivateTarget(null)
      await loadVendors()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Deactivate failed'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setDeactivating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    try {
      await deleteVendor(deleteTarget.id)
      showToast(`${deleteTarget.name} deleted.`)
      setDeleteTarget(null)
      await loadVendors()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back
            </button>
          ) : null}
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Manage Vendors</h1>
          <p className="mt-1 text-slate-600">Supplier directory, purchase totals, and account status.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateCreate?.()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all duration-200 hover:from-blue-500 hover:to-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add New Vendor
        </button>
      </header>

      {error ? (
        <ApiErrorAlert message={error} onRetry={() => void loadVendors()} />
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </label>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter Vendors"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading vendors…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-sm text-slate-500">No vendors match your filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Vendor Name</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total Purchases</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, index) => {
                  const active = row.isActive && row.status.toLowerCase() !== 'inactive'
                  return (
                    <tr
                      key={row.id}
                      className={[
                        'border-b border-slate-100 transition-colors duration-200 hover:bg-slate-50',
                        index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.contactPerson}</td>
                      <td className="px-4 py-3 text-slate-600">{row.phone}</td>
                      <td className="px-4 py-3 text-slate-600">{row.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase',
                            active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800',
                          ].join(' ')}
                        >
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-800">
                        {formatMoney(row.totalPurchases)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <ActionPill
                            label="View"
                            tone="blue"
                            onClick={() => setViewing(row)}
                          />
                          <ActionPill
                            label="Edit"
                            tone="amber"
                            onClick={() => {
                              setEditing(row)
                              setModalMode('edit')
                            }}
                          />
                          {active ? (
                            <ActionPill
                              label="Deactivate"
                              tone="red"
                              onClick={() => setDeactivateTarget(row)}
                            />
                          ) : null}
                          <ActionPill
                            label="Delete"
                            tone="slate"
                            onClick={() => setDeleteTarget(row)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of{' '}
              {filtered.length} vendors
            </p>
            <div className="flex items-center justify-end gap-1">
              <PaginationBtn
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </PaginationBtn>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={[
                    'min-w-[2.25rem] rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200',
                    n === safePage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
              <PaginationBtn
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </PaginationBtn>
            </div>
          </div>
        ) : null}
      </div>

      <VendorFormModal
        mode="edit"
        open={modalMode === 'edit'}
        initial={editing}
        loading={saving}
        onClose={() => {
          setModalMode(null)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      {viewing ? (
        <VendorViewModal
          vendor={viewing}
          onClose={() => setViewing(null)}
          onEdit={(v) => {
            setEditing(v)
            setModalMode('edit')
          }}
        />
      ) : null}

      <VendorDeactivateDialog
        open={Boolean(deactivateTarget)}
        vendorName={deactivateTarget?.name}
        loading={deactivating}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => void handleDeactivate()}
      />

      <DeleteVendorDialog
        open={Boolean(deleteTarget)}
        vendorName={deleteTarget?.name}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />

      {toast ? <ToastBanner toast={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  )
}

function ActionPill({
  label,
  tone,
  onClick,
}: {
  label: string
  tone: 'blue' | 'amber' | 'red' | 'slate'
  onClick: () => void
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100',
    slate: 'bg-slate-100 text-slate-800 ring-slate-300 hover:bg-slate-200',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-all duration-200',
        tones[tone],
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function PaginationBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const ok = toast.type === 'success'
  return (
    <div
      role="status"
      className={[
        'fixed bottom-4 right-4 z-[60] flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
        ok ? 'bg-emerald-600' : 'bg-red-600',
      ].join(' ')}
    >
      <span className="flex-1">{toast.message}</span>
      <button type="button" onClick={onDismiss} className="opacity-80 hover:opacity-100" aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
