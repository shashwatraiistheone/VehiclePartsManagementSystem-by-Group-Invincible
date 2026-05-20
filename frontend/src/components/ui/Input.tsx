import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type FieldProps = {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input({ label, error, hint, required, className, id, ...props }, ref) {
  const inputId = id ?? props.name
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="vms-label">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn('vms-input', error && 'border-red-400 focus:border-red-500 focus:shadow-red-500/15', className)}
        {...props}
      />
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  )
})

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea({ label, error, hint, required, className, id, rows = 4, ...props }, ref) {
  const inputId = id ?? props.name
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="vms-label">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          'vms-input min-h-[120px] resize-y',
          error && 'border-red-400 focus:border-red-500',
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  )
})
