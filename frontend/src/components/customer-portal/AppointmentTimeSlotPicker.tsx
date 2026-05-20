import type { SlotAvailability } from '../../services/appointmentApi'
import { APPOINTMENT_TIME_SLOTS } from './appointmentConstants'

type Props = {
  availability: Map<string, SlotAvailability>
  selectedTime: string
  onSelect: (time: string) => void
  loading?: boolean
}

function capacityLabel(info: SlotAvailability | undefined): string {
  if (!info) return ''
  if (info.isFull) return 'FULL'
  if (!info.isBookable) return ''
  const left = Math.max(0, info.max - info.booked)
  return `${left} left`
}

function slotDisplayLabel(
  fallbackLabel: string,
  info: SlotAvailability | undefined,
): string {
  if (info?.label?.includes('-')) return info.label
  return fallbackLabel
}

function SlotSkeleton() {
  return (
    <div
      className="h-[52px] animate-pulse rounded-full border border-slate-100 bg-slate-50"
      aria-hidden
    />
  )
}

export function AppointmentTimeSlotPicker({
  availability,
  selectedTime,
  onSelect,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div
        className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3"
        aria-busy="true"
        aria-label="Loading time slots"
      >
        {APPOINTMENT_TIME_SLOTS.map((slot) => (
          <SlotSkeleton key={slot.value} />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3" role="listbox" aria-label="Preferred time">
      {APPOINTMENT_TIME_SLOTS.map((slot) => {
        const info = availability.get(slot.value)
        const selected = selectedTime === slot.value
        const bookable = info?.isBookable ?? false
        const disabled = !bookable
        const capacity = capacityLabel(info)
        const label = slotDisplayLabel(slot.label, info)

        return (
          <button
            key={slot.value}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={disabled}
            title={info?.reason ?? undefined}
            onClick={() => {
              if (!bookable) return
              onSelect(slot.value)
            }}
            className={[
              'group relative flex min-h-[52px] w-full flex-col items-center justify-center rounded-full border-2 px-3 py-3 text-center transition-all duration-200',
              selected && bookable
                ? 'border-transparent bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/35 ring-2 ring-blue-500/20'
                : bookable
                  ? 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm'
                  : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60',
            ].join(' ')}
          >
            <span
              className={[
                'text-[13px] font-semibold leading-tight tracking-tight',
                selected && bookable ? 'text-white' : bookable ? 'text-slate-800' : 'text-slate-400',
              ].join(' ')}
            >
              {label}
            </span>
            {capacity ? (
              <span
                className={[
                  'mt-0.5 text-[11px] font-medium',
                  selected && bookable
                    ? 'text-blue-100'
                    : info?.isFull
                      ? 'uppercase tracking-wide text-slate-400'
                      : bookable
                        ? 'text-slate-500'
                        : 'text-slate-400',
                ].join(' ')}
              >
                {capacity}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
