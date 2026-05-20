import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

type Option = { value: string; label: string }

type Props = {
  label: string
  value: string
  options: Option[]
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  onChange: (value: string) => void
}

export function SearchableSelect({
  label,
  value,
  options,
  placeholder = 'Select…',
  error,
  disabled,
  required,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find((o) => o.value === value)?.label ?? ''

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="relative block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-sm transition-all duration-200',
          'hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50',
          error ? 'border-red-400' : 'border-slate-200',
        ].join(' ')}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}

      {open ? (
        <div className="absolute z-30 mt-1 w-full origin-top animate-[dropdownIn_0.15s_ease-out] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500">No matches</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={[
                      'w-full px-3 py-2 text-left text-sm transition hover:bg-blue-50',
                      o.value === value ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-700',
                    ].join(' ')}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
