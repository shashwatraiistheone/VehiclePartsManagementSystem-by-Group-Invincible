type Props = {
  open: boolean
  partName?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function PartDeleteDialog({ open, partName, loading, onCancel, onConfirm }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">Delete part permanently?</h3>
        <p className="mt-2 text-sm text-slate-600">
          {partName ? (
            <>
              <span className="font-semibold text-slate-800">{partName}</span> will be removed from the
              catalogue. This cannot be undone.
            </>
          ) : (
            'This part will be removed from the catalogue permanently.'
          )}
        </p>
        <p className="mt-2 text-xs text-amber-700">
          Parts linked to sales or purchases cannot be deleted — use Deactivate instead.
        </p>
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
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
