import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  UserCog,
  Package,
  ClipboardList,
  Building2,
  Truck,
  FileText,
  Eye,
  PieChart,
  Search,
  IdCard,
  History,
  Gift,
  Mail,
  CalendarDays,
  BellRing,
} from 'lucide-react'

export type FeatureStatus = 'Completed' | 'Pending'

export type AdminFeature16 = {
  id: number
  title: string
  description: string
  status: FeatureStatus
  Icon: LucideIcon
}

/**
 * Scenario feature IDs: completed except 5, 11, and 15.
 */
export const ADMIN_FEATURES_16: AdminFeature16[] = [
  {
    id: 1,
    title: 'Financial Reports',
    description: 'Summaries, margins, and export-ready financial views.',
    status: 'Completed',
    Icon: Banknote,
  },
  {
    id: 2,
    title: 'Staff Registration and Role Management',
    description: 'Register staff and assign Admin or Staff roles.',
    status: 'Completed',
    Icon: UserCog,
  },
  {
    id: 3,
    title: 'Parts Management',
    description: 'Catalogue, pricing, and stock for vehicle parts.',
    status: 'Completed',
    Icon: Package,
  },
  {
    id: 4,
    title: 'Purchase Invoice Management',
    description: 'Record supplier purchases and invoice lines.',
    status: 'Completed',
    Icon: ClipboardList,
  },
  {
    id: 5,
    title: 'Vendor Management',
    description: 'Supplier records, contacts, and procurement.',
    status: 'Completed',
    Icon: Building2,
  },
  {
    id: 6,
    title: 'Customer Registration with Vehicle Details',
    description: 'Onboard customers and link vehicles to profiles.',
    status: 'Completed',
    Icon: Truck,
  },
  {
    id: 7,
    title: 'Sales and Invoice Management',
    description: 'Sales orders, line items, and customer invoices.',
    status: 'Completed',
    Icon: FileText,
  },
  {
    id: 8,
    title: 'Customer Details and History Viewing',
    description: 'Profiles with purchase and service history.',
    status: 'Completed',
    Icon: Eye,
  },
  {
    id: 9,
    title: 'Customer Reports',
    description: 'Segments, activity, and loyalty analytics.',
    status: 'Completed',
    Icon: PieChart,
  },
  {
    id: 10,
    title: 'Customer Search',
    description: 'Fast lookup in the customer directory.',
    status: 'Completed',
    Icon: Search,
  },
  {
    id: 11,
    title: 'Email Invoice Sending',
    description: 'Email PDF invoices and payment reminders.',
    status: 'Pending',
    Icon: Mail,
  },
  {
    id: 12,
    title: 'Customer Self-Registration',
    description: 'Public registration flow for new buyers.',
    status: 'Completed',
    Icon: IdCard,
  },
  {
    id: 13,
    title: 'Appointment and Service Requests',
    description: 'Workshop scheduling and service workflows.',
    status: 'Completed',
    Icon: CalendarDays,
  },
  {
    id: 14,
    title: 'Purchase and Service History',
    description: 'Historical sales and services per customer.',
    status: 'Completed',
    Icon: History,
  },
  {
    id: 15,
    title: 'Low Stock Notification and Credit Reminder System',
    description: 'Automated low-stock and credit follow-ups.',
    status: 'Completed',
    Icon: BellRing,
  },
  {
    id: 16,
    title: 'Loyalty Program',
    description: 'Discounts and loyalty tiers on qualifying sales.',
    status: 'Completed',
    Icon: Gift,
  },
]

/** Admin Dashboard modules (only usable completed features). */
export const ADMIN_ACCESS_GRID_KEYS = [
  { label: 'Financial Reports', featureId: 1 as const },
  { label: 'Staff Management', featureId: 2 as const },
  { label: 'Parts Management', featureId: 3 as const },
  { label: 'Purchase Invoice', featureId: 4 as const },
  { label: 'Vendor Management', featureId: 5 as const },
  { label: 'Customer Management', featureId: 6 as const },
  { label: 'Sales & Invoice', featureId: 7 as const },
  { label: 'Customer Reports', featureId: 9 as const },
  { label: 'Customer Search', featureId: 10 as const },
  { label: 'Customer History', featureId: 14 as const },
  { label: 'Appointments', featureId: 13 as const },
  { label: 'Loyalty Program', featureId: 16 as const },
] as const

export function getFeatureById(id: number): AdminFeature16 | undefined {
  return ADMIN_FEATURES_16.find((f) => f.id === id)
}
