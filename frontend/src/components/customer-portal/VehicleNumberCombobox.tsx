import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { fetchVehicleNumberSuggestions } from '../../services/customerApi'

type Props = {
  value: string
  onChange: (value: string) => void
  existingNumbers?: string[]
  disabled?: boolean
  error?: string
  onBlur?: () => void
}

export function VehicleNumberCombobox({
  value,
  onChange,
  existingNumbers = [],
  disabled,
  error,
  onBlur,
}: Props) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [remote, setRemote] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const loadSuggestions = useCallback(async (term: string) => {
    setLoading(true)
    try {
      const data = await fetchVehicleNumberSuggestions(term)
      setRemote(data)
    } catch {
      setRemote([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      void loadSuggestions(value)
    }, 200)
    return () => window.clearTimeout(timer)
  }, [value, open, loadSuggestions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const merged = Array.from(
    new Set([
      ...existingNumbers.map((n) => n.toUpperCase()),
      ...remote.map((n) => n.toUpperCase()),
    ]),
  )
    .filter((n) => !value.trim() || n.includes(value.trim().toUpperCase()))
    .slice(0, 12)

  function selectOption(option: string) {
    onChange(option.toUpperCase())
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (!open || merged.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % merged.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? merged.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectOption(merged[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={listId}
          type="text"
          value={value}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
          onChange={(e) => {
            onChange(e.target.value.toUpperCase())
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              onBlur?.()
            }, 150)
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. ABC-1234"
          className={[
            'w-full rounded-lg border bg-white py-2.5 pl-3 pr-10 text-sm text-slate-900 outline-none transition',
            'focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15',
            error ? 'border-red-300' : 'border-slate-200',
            disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500' : '',
          ].join(' ')}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 hover:text-slate-600"
          aria-label="Show vehicle number suggestions"
        >
          <ChevronDownIcon className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}

      {open && (merged.length > 0 || loading) ? (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading && merged.length === 0 ? (
            <li className="px-3 py-2 text-xs text-slate-500">Searching…</li>
          ) : null}
          {merged.map((option, index) => (
            <li key={option} role="option" aria-selected={activeIndex === index}>
              <button
                type="button"
                className={[
                  'w-full px-3 py-2 text-left text-sm',
                  activeIndex === index ? 'bg-blue-50 text-blue-700' : 'text-slate-800 hover:bg-slate-50',
                ].join(' ')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
