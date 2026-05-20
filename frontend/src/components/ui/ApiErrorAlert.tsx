import { AlertTriangle, RefreshCw } from 'lucide-react'

type Props = {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export function ApiErrorAlert({
  title = 'Unable to load data',
  message,
  onRetry,
  retryLabel = 'Try again',
}: Props) {
  return (
    <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 p-5 shadow-sm dark:border-rose-900 dark:bg-rose-950/50">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-rose-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-rose-800">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-800 shadow-sm transition hover:bg-rose-50"
            >
              <RefreshCw className="h-4 w-4" />
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
