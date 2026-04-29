import { Search, ShoppingCart, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { staffPath } from '../../staff/staffRoutes'
import type { StaffViewId } from '../../staff/staffViewId'

export function StaffSearchSalePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function go(view: StaffViewId) {
    navigate(staffPath(view))
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search &amp; Sale</h1>
        <p className="mt-1 text-slate-600">Find a customer, then start a sale or open their profile.</p>
      </header>

      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-md">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name, phone, vehicle…" />
        <p className="mt-4 text-sm text-slate-500">
          Customer directory search opens on Manage Customers. Use the actions below to continue.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => go('manage-customers')}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <Users className="h-4 w-4 text-blue-600" />
            Open customer directory
          </button>
          <button
            type="button"
            onClick={() => go('sales-history')}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
          >
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            Sales / invoices
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
        <Search className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span>
          Tip: set filters on the customer page, then return here to copy phone numbers into your POS flow when you wire
          search to the API.
        </span>
      </div>
    </div>
  )
}
