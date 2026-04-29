import { useState } from 'react'
import { UserPlus } from 'lucide-react'

function safeJson(text: string) {
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function StaffRegisterCustomerPage({ onDone }: { onDone?: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL as string
      const res = await fetch(`${apiBase}/api/Customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          address: vehicle.trim() ? `Vehicle: ${vehicle.trim()}` : '',
        }),
      })
      const text = await res.text()
      const data = safeJson(text) as { message?: string } | null
      if (!res.ok) throw new Error((data && data.message) || 'Failed to register')
      setMessage('Customer registered successfully.')
      setName('')
      setEmail('')
      setPhone('')
      setVehicle('')
      onDone?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Register Customer</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Capture contact details and vehicle information (vehicle stored in address notes until the API adds a
          dedicated field).
        </p>
      </header>

      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-md">
        {message ? (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>
        ) : null}
        {error ? <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Vehicle number / notes
            <input
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              placeholder="e.g. WP-CA-1234"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {saving ? 'Saving…' : 'Register customer'}
          </button>
        </form>
      </div>
    </div>
  )
}
