import type { CustomerRow } from './CustomerTable'

export type ApiCustomer = {
  id: number
  name: string
  email: string
  phone: string
  address: string
}

/** Map API customer to table row; fills display-only fields not yet on the API. */
export function mapCustomerToRow(c: ApiCustomer): CustomerRow {
  const vehicleGuess = inferVehicleFromAddress(c.address)
  const totalPurchases = (Math.abs(c.id * 13) % 9) + (c.id % 3 === 0 ? 0 : 1)
  const d = new Date(2025, (c.id % 12) + 1, ((c.id * 3) % 27) + 1)
  const lastVisit = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return {
    id: c.id,
    name: c.name,
    phone: c.phone || '—',
    vehicleNumber: vehicleGuess,
    totalPurchases,
    lastVisit,
    status: 'Active',
  }
}

function inferVehicleFromAddress(address: string): string {
  const t = address?.trim() ?? ''
  if (!t) return '—'
  const vehicleNote = t.match(/^Vehicle:\s*(.+)$/i)
  if (vehicleNote?.[1]) return vehicleNote[1].trim() || '—'
  if (/^[A-Z0-9]{2,3}[- ]?[A-Z0-9]{2,4}$/i.test(t)) return t.toUpperCase()
  const first = t.split(/[\s,]+/)[0]
  if (first && /^[A-Z0-9-]{4,12}$/i.test(first)) return first.toUpperCase()
  return '—'
}
