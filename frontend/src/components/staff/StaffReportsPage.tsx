import { FileDown, PieChart } from 'lucide-react'

export function StaffReportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Reports</h1>
        <p className="mt-1 text-slate-600">Generate summaries for activity, segments, and loyalty.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-md">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <PieChart className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">Report builder</h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose date range and customer segments. Wire this panel to your reporting service.
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-6 shadow-md">
          <div>
            <h2 className="font-semibold text-slate-900">Generate customer report</h2>
            <p className="mt-2 text-sm text-slate-600">
              Export a CSV or PDF snapshot of the current customer directory and key metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              window.alert('Report generation: connect to your export endpoint or client-side CSV builder.')
            }
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <FileDown className="h-4 w-4" />
            Generate Customer Report
          </button>
        </div>
      </div>
    </div>
  )
}
