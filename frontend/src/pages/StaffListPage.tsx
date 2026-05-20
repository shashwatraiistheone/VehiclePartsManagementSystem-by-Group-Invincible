import { useCallback, useEffect, useState } from 'react'
import { Eye, Loader2, Pencil, Trash2, UserMinus, UserPlus, X } from 'lucide-react'
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
import { ApiErrorAlert } from '../components/ui/ApiErrorAlert'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/ToastProvider'
import { extractApiErrorMessage } from '../lib/apiClient'

type ConfirmAction = {
  staff: StaffMember
  type: 'deactivate' | 'delete'
}

type Props = {
  onBack?: () => void
}

export default function StaffListPage({ onBack: _onBack }: Props) {
  const { showToast } = useToast()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [viewing, setViewing] = useState<StaffMember | null>(null)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchStaff()
      setStaff(rows)
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Failed to load staff.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  async function handleFormSubmit(payload: RegisterStaffPayload | UpdateStaffPayload) {
    setSaving(true)
    setFormError(null)
    try {
      if (modalMode === 'create') {
        const createPayload = payload as RegisterStaffPayload
        await registerStaff(createPayload)
        showToast(
          `Staff member added. Temporary password: ${createPayload.password}`,
          'success',
        )
      } else if (editing) {
        await updateStaff(editing.id, payload as UpdateStaffPayload)
        showToast('Staff member updated successfully.', 'success')
      }
      setModalMode(null)
      setEditing(null)
      await loadStaff()
    } catch (err) {
      setFormError(extractApiErrorMessage(err, 'Failed to save staff member.'))
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Register, edit, deactivate, or remove staff accounts.
        </p>
        <Button
          icon={<UserPlus className="h-4 w-4" />}
          onClick={() => {
            setEditing(null)
            setFormError(null)
            setModalMode('create')
          }}
        >
          Add Staff
        </Button>
      </div>

      {error ? (
        <ApiErrorAlert message={error} onRetry={() => void loadStaff()} />
      ) : null}

      <TableSection
        loading={loading}
        staff={staff}
        onView={setViewing}
        onEdit={setEditingAndEdit}
        onDeactivate={setDeactivateConfirm}
        onDelete={setDeleteConfirm}
      />

      <StaffFormModal
        mode={modalMode === 'edit' ? 'edit' : 'create'}
        open={modalMode !== null}
        initial={editing}
        loading={saving}
        error={formError}
        onClose={() => {
          setModalMode(null)
          setEditing(null)
          setFormError(null)
        }}
        onSubmit={handleFormSubmit}
      />

      {viewing ? <StaffViewModal staff={viewing} onClose={() => setViewing(null)} onEdit={setEditingAndEdit} /> : null}

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
    setFormError(null)
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
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}: {
  loading: boolean
  staff: StaffMember[]
  onView: (row: StaffMember) => void
  onEdit: (row: StaffMember) => void
  onDeactivate: (row: StaffMember) => void
  onDelete: (row: StaffMember) => void
}) {
  return (
    <div className="vms-table-wrap">
      {loading ? (
        <LoadingRow />
      ) : staff.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">No staff members yet.</p>
      ) : (
        <StaffTable staff={staff} onView={onView} onEdit={onEdit} onDeactivate={onDeactivate} onDelete={onDelete} />
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
  onView,
  onEdit,
  onDeactivate,
  onDelete,
}: {
  staff: StaffMember[]
  onView: (row: StaffMember) => void
  onEdit: (row: StaffMember) => void
  onDeactivate: (row: StaffMember) => void
  onDelete: (row: StaffMember) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="vms-table">
        <thead>
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((row) => (
            <tr key={row.id}>
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
                    title="View"
                    onClick={() => onView(row)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
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

function StaffViewModal({
  staff,
  onClose,
  onEdit,
}: {
  staff: StaffMember
  onClose: () => void
  onEdit: (row: StaffMember) => void
}) {
  const createdLabel = staff.createdAt
    ? new Date(staff.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Staff details</h2>
            <p className="text-sm text-slate-500">View account information for this staff member.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <dl className="space-y-4 px-6 py-5 text-sm">
          <ViewField label="Name" value={staff.fullName} />
          <ViewField label="Email" value={staff.email} />
          <ViewField label="Phone" value={staff.phone || '—'} />
          <ViewField label="Role" value={staff.role} />
          <ViewField label="Status" value={staff.isActive ? 'Active' : 'Inactive'} />
          <ViewField label="Registered" value={createdLabel} />
        </dl>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(staff)
            }}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Edit staff
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
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
