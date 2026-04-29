import { AppointmentTable } from './AppointmentTable'

export function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Appointments &amp; Service Requests</h1>
        <p className="mt-1 text-slate-600">Review requests, approve workshop slots, and track completion.</p>
      </header>

      <AppointmentTable />
    </div>
  )
}
