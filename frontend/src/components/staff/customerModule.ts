export type CustomerStatus = 'Active' | 'Inactive'

export type Customer = {
  id: number
  name: string
  phone: string
  address: string
  vehicleNumber: string
  vehicleType: string
  totalPurchases: number
  lastVisit: string
  status: CustomerStatus
}

export type CustomerInput = {
  name: string
  phone: string
  address: string
  vehicleNumber: string
  vehicleType: string
}

export type PartOption = {
  id: string
  name: string
  price: number
}

export type SaleLine = {
  partId: string
  quantity: number
}

export const PARTS_CATALOG: PartOption[] = [
  { id: 'oil-filter', name: 'Oil Filter', price: 850 },
  { id: 'spark-plug', name: 'Spark Plug Set', price: 2200 },
  { id: 'brake-pad', name: 'Brake Pad Set', price: 4800 },
  { id: 'air-filter', name: 'Air Filter', price: 1300 },
  { id: 'battery-12v', name: 'Battery 12V', price: 10900 },
  { id: 'coolant', name: 'Engine Coolant', price: 950 },
]

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1001,
    name: 'Nimal Perera',
    phone: '0771234567',
    address: 'No. 25, Galle Road, Colombo',
    vehicleNumber: 'CAB-4521',
    vehicleType: 'Sedan',
    totalPurchases: 7,
    lastVisit: '2026-04-20',
    status: 'Active',
  },
  {
    id: 1002,
    name: 'Dilani Jayawardena',
    phone: '0712233445',
    address: 'Maharagama, Colombo',
    vehicleNumber: 'WP-KA-7788',
    vehicleType: 'SUV',
    totalPurchases: 3,
    lastVisit: '2026-03-02',
    status: 'Active',
  },
  {
    id: 1003,
    name: 'Kasun Silva',
    phone: '0768899001',
    address: 'Kandy',
    vehicleNumber: 'CAA-1190',
    vehicleType: 'Hatchback',
    totalPurchases: 1,
    lastVisit: '2025-11-28',
    status: 'Inactive',
  },
]

export function toDisplayDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getPartById(partId: string): PartOption | undefined {
  return PARTS_CATALOG.find((p) => p.id === partId)
}
