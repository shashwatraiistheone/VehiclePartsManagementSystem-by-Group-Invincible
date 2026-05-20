import { ChartBarIcon } from '@heroicons/react/24/outline'
import { APP_NAME } from '../lib/appBranding'
import { MaintenanceAiToolbar } from '../components/customer-portal/MaintenanceAiToolbar'

type Props = {
  onLogin: () => void
  onRegister: () => void
}

export function PredictiveMaintenancePublicPage({ onLogin, onRegister }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <header className="border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-md lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {APP_NAME}
            </p>
            <p className="text-sm font-semibold text-slate-900">Customer Portal</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogin}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onRegister}
              className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-indigo-700"
            >
              Sign up free
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 p-4 pb-12 lg:p-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Predictive Maintenance Dashboard
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            AI Maintenance Insights
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Predictive maintenance analysis based on your driving patterns and service history.
            Sign in to choose your vehicle and log usage.
          </p>
        </header>

        <MaintenanceAiToolbar
          vehicles={[]}
          selectedVehicleId={null}
          onSelectVehicle={() => {}}
          onLogUsage={onLogin}
          onLogin={onLogin}
          onRegister={onRegister}
          logUsageDisabled
        />

        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-200/30">
          <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-200 sm:text-base">
                Last Odometer: <span className="text-lg font-bold text-white sm:text-2xl">— Miles</span>
              </p>
              <button
                type="button"
                onClick={onLogin}
                className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md sm:text-sm"
              >
                Log Your Usage
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Your vehicle will appear here after you sign in</p>
          </header>

          <div className="flex min-h-[280px] flex-col items-center justify-center bg-slate-50/80 px-4 py-12 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
              <ChartBarIcon className="h-10 w-10" strokeWidth={1.25} />
            </span>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-600">
              Login to choose your car, log your mileage, and unlock AI maintenance predictions for
              brakes, oil filter, battery, and more.
            </p>
            <button
              type="button"
              onClick={onLogin}
              className="mt-6 rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-7 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700"
            >
              Login to get started
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
