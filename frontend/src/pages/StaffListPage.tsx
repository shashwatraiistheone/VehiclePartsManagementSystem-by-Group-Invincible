import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Trash2, UserMinus, UserPlus } from 'lucide-react'
import { StaffFormModal } from '../components/admin/StaffFormModal'
import {
  deactivateStaff,
  deleteStaff,
  fetchStaff,
  registerStaff,
  updateStaff,
  type RegisterStaffPayload,
  type StaffMember,
  type UpdateStaffPayload,
} from '../services/staffApi'

type ConfirmAction = {
  staff: StaffMember
  type: 'deactivate' | 'delete'
}

type Props = {
  onBack?: () => void
}

export default function StaffListPage({ onBack }: Props) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchStaff()
      setStaff(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  async function handleFormSubmit(payload: RegisterStaffPayload | UpdateStaffPayload) {
    setSaving(true)
    setError(null)
    try {
      if (modalMode === 'create') {
        await registerStaff(payload as RegisterStaffPayload)
      } else if (editing) {
        await updateStaff(editing.id, payload as UpdateStaffPayload)
      }
      setModalMode(null)
      setEditing(null)
      await loadStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirm() {
    if (!confirm) return
    setActionLoading(true)
    setError(null)
    try {
      if (confirm.type === 'deactivate') {
        await deactivateStaff(confirm.staff.id)
      } else {
        await deleteStaff(confirm.staff.id)
      }
      setConfirm(null)
      await loadStaff()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <PageShell>
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Staff management</h1>
          <p className="mt-1 text-slate-600">Register, edit, deactivate, or remove staff accounts.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setModalMode('create')
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-500"
        >
          <UserPlus className="h-4 w-4" />
          Add staff
        </button>
      </header>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <TableSection loading={loading} staff={staff} onEdit={setEditingAndEdit} onDeactivate={setDeactivateConfirm} onDelete={setDeleteConfirm} />

      <StaffFormModal
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        open={modalMode !== null}
        initial={editing}
        loading={saving}
        onClose={() => {
          setModalMode(null)
          setEditing(null)
        }}
        onSubmit={handleFormSubmit}
      />

      {confirm ? (
        <ConfirmDialog
          confirm={confirm}
          loading={actionLoading}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void handleConfirm()}
        />
      ) : null}
    </PageShell>
  )

  function setEditingAndEdit(row: StaffMember) {
    setEditing(row)
    setModalMode('edit')
  }

  function setDeactivateConfirm(row: StaffMember) {
    setConfirm({ staff: row, type: 'deactivate' })
  }

  function setDeleteConfirm(row: StaffMember) {
    setConfirm({ staff: row, type: 'delete' })
  }
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>
}

function TableSection({
  loading,
  staff,
  onEdit,
  onDeactivate,
  onDelete,
}: {
  loading: boolean
  staff: StaffMember[]
  onEdit: (row: StaffMember) => void
  onDeactivate: (row: StaffMember) => void
  onDelete: (row: StaffMember) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      {loading ? (
        <LoadingRow />
      ) : staff.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">No staff members yet.</p>
      ) : (
        <StaffTable staff={staff} onEdit={onEdit} onDeactivate={onDeactivate} onDelete={onDelete} />
      )}
    </div>
  )
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      Loading staff…
    </div>
  )
}

function StaffTable({
  staff,
  onEdit,
  onDeactivate,
  onDelete,
}: {
  staff: StaffMember[]
  onEdit: (row: StaffMember) => void
  onDeactivate: (row: StaffMember) => void
  onDelete: (row: StaffMember) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {staff.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
              <td className="px-4 py-3 text-slate-600">{row.email}</td>
              <td className="px-4 py-3 text-slate-600">{row.phone}</td>
              <td className="px-4 py-3">
                <span
                  className={[
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    row.role === 'Admin' ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800',
                  ].join(' ')}
                >
                  {row.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={[
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    row.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600',
                  ].join(' ')}
                >
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => onEdit(row)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {row.isActive ? (
                    <button
                      type="button"
                      title="Deactivate"
                      onClick={() => onDeactivate(row)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => onDelete(row)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ConfirmDialog({
  confirm,
  loading,
  onCancel,
  onConfirm,
}: {
  confirm: ConfirmAction
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const isDelete = confirm.type === 'delete'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <ConfirmPanel confirm={confirm} isDelete={isDelete} loading={loading} onCancel={onCancel} onConfirm={onConfirm} />
    </div>
  )
}

function ConfirmPanel({
  confirm,
  isDelete,
  loading,
  onCancel,
  onConfirm,
}: {
  confirm: ConfirmAction
  isDelete: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
      <h3 className="text-lg font-bold text-slate-900">
        {isDelete ? 'Delete staff account?' : 'Deactivate staff account?'}
      </h3>
      <p className="mt-2 text-sm text-slate-600">
        {isDelete
          ? `Permanently remove ${confirm.staff.fullName}? This cannot be undone.`
          : `${confirm.staff.fullName} will no longer be able to sign in.`}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={[
            'rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60',
            isDelete ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500',
          ].join(' ')}
        >
          {loading ? 'Working…' : isDelete ? 'Delete' : 'Deactivate'}
        </button>
      </div>
    </div>
  )
}
