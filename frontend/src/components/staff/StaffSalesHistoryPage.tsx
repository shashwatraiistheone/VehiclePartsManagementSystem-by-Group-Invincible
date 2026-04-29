import { Receipt } from 'lucide-react'

export function StaffSalesHistoryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales History</h1>
        <p className="mt-1 text-slate-600">Sales and invoice management — connect to your orders API when ready.</p>
      </header>

      <div className="rounded-xl border border-slate-200/90 bg-white p-8 text-center shadow-md">
        <Receipt className="mx-auto h-10 w-10 text-blue-600" />
        <p className="mt-4 text-sm text-slate-600">
          This view will list invoices, payment status, and filters. For now, record sales in your backend and attach
          this UI to <code className="rounded bg-slate-100 px-1 text-xs">/api</code> endpoints.
        </p>
      </div>
    </div>
  )
}
