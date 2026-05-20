import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Vehicle } from '../../services/customerApi'
import { UpdateUsageForm } from './UpdateUsageForm'

type Props = {
  open: boolean
  vehicles: Vehicle[]
  initialVehicleId?: number | null
  onClose: () => void
  onSuccess: () => void
}

export function UpdateUsageModal({ open, vehicles, initialVehicleId, onClose, onSuccess }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1 -top-1 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-md ring-1 ring-slate-200 hover:bg-slate-50"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
        <UpdateUsageForm
          vehicles={vehicles}
          initialVehicleId={initialVehicleId}
          onBack={onClose}
          onSuccess={() => {
            onSuccess()
            onClose()
          }}
        />
      </div>
    </div>
  )
}
