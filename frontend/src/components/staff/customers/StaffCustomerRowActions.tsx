import { Link } from 'react-router-dom'
import { History, ShoppingCart, User } from 'lucide-react'

type Props = {
  onHistory: () => void
  onSale: () => void
  onProfile: () => void
  /** When set, Sale navigates via router Link (more reliable than click-only handlers). */
  saleTo?: string
  compact?: boolean
}

export function StaffCustomerRowActions({
  onHistory,
  onSale,
  onProfile,
  saleTo,
  compact,
}: Props) {
  const saleButtonClass =
    'inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-blue-600 hover:shadow-md'
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'justify-end gap-2'}`}>
      <button
        type="button"
        onClick={onHistory}
        title="View customer history"
        aria-label="View customer history"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <History className="h-4 w-4" aria-hidden />
      </button>
      {saleTo ? (
        <Link to={saleTo} title="Create sale" className={saleButtonClass}>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Sale
        </Link>
      ) : (
        <button type="button" onClick={onSale} title="Create sale" className={saleButtonClass}>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Sale
        </button>
      )}
      <button
        type="button"
        onClick={onProfile}
        title="View profile"
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <User className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
        Profile
      </button>
    </div>
  )
}
