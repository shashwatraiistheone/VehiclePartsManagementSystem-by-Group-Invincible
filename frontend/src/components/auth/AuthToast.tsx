import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export type ToastVariant = 'error' | 'success' | 'info'

export function AuthToast(props: {
  message: string
  variant?: ToastVariant
  onDismiss?: () => void
}) {
  const variant = props.variant ?? 'error'
  const styles = {
    error: 'border-red-200/80 bg-red-50 text-red-900 shadow-red-500/5',
    success: 'border-emerald-200/80 bg-emerald-50 text-emerald-900 shadow-emerald-500/5',
    info: 'border-blue-200/80 bg-blue-50 text-blue-900 shadow-blue-500/5',
  }[variant]

  const Icon = variant === 'success' ? CheckCircleIcon : ExclamationCircleIcon

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm',
        styles,
      ].join(' ')}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-80" aria-hidden />
      <p className="flex-1 leading-snug">{props.message}</p>
      {props.onDismiss ? (
        <button
          type="button"
          onClick={props.onDismiss}
          className="rounded-md p-0.5 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
