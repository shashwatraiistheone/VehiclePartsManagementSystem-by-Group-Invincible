import { Search } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search by name, phone, vehicle…',
  className = '',
}: Props) {
  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/20',
        className,
      ].join(' ')}
    >
      <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        autoComplete="off"
      />
    </div>
  )
}
