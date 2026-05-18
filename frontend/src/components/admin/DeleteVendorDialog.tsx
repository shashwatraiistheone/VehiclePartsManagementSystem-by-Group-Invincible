import { Loader2 } from 'lucide-react'

type Props = {
  open: boolean
  vendorName?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteVendorDialog({ open, vendorName, loading, onCancel, onConfirm }: Props) {
  if (!open) return null

  return (
    <ModalBackdrop onClose={loading ? undefined : onCancel}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900">Delete vendor?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Remove <strong>{vendorName}</strong>? Vendors linked to parts cannot be deleted.
        </p>
        <DialogActions loading={loading} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </ModalBackdrop>
  )
}

function ModalBackdrop({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose?: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>
  )
}

function DialogActions({
  loading,
  onCancel,
  onConfirm,
}: {
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  )
}
