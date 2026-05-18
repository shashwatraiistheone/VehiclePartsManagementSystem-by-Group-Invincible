import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { DeleteVendorDialog } from '../components/admin/DeleteVendorDialog'
import { VendorFormModal } from '../components/admin/VendorFormModal'
import {
  createVendor,
  deleteVendor,
  fetchVendors,
  updateVendor,
  type CreateVendorPayload,
  type UpdateVendorPayload,
  type Vendor,
} from '../services/vendorApi'

type Toast = { message: string; type: 'success' | 'error' }

type Props = {
  onBack?: () => void
}

export default function VendorListPage({ onBack }: Props) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return vendors
    return vendors.filter((v) => v.name.toLowerCase().includes(q))
  }, [vendors, search])

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
      setError(err instanceof Error ? err.message : 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadVendors()
  }, [loadVendors])

  async function handleSubmit(payload: CreateVendorPayload | UpdateVendorPayload) {
    setSaving(true)
    setError(null)
    try {
      if (modalMode === 'create') {
        await createVendor(payload as CreateVendorPayload)
        showToast('Vendor added successfully.')
      } else if (editing) {
        await updateVendor(editing.id, payload as UpdateVendorPayload)
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Vendor management</h1>
          <p className="mt-1 text-slate-600">Manage parts suppliers and contact details.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalMode('create')
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add vendor
        </button>
      </header>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search vendors by name…"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading vendors…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">No vendors match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact person</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.contactPerson}</td>
                    <td className="px-4 py-3 text-slate-600">{row.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{row.email}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => {
                          setEditing(row)
                          setModalMode('edit')
                        }}
                        className="mr-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil className="inline h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => setDeleteTarget(row)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="inline h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VendorFormModal
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        open={modalMode !== null}
        initial={editing}
        loading={saving}
        onClose={() => {
          setModalMode(null)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
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
