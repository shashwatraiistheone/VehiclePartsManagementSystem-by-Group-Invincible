import type { ComponentType, SVGProps } from 'react'
import {
  BanknotesIcon,
  UserPlusIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  DocumentTextIcon,
  EyeIcon,
  ChartPieIcon,
  MagnifyingGlassIcon,
  IdentificationIcon,
  ClockIcon,
  GiftIcon,
  BuildingStorefrontIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline'

/** Sidebar sections a completed module may open. */
export type ScenarioNavTab = 'parts' | 'customers' | 'sales' | 'reports' | 'staff'

export type ScenarioFeatureStatus = 'Completed' | 'Pending'

export type ScenarioFeature = {
  id: string
  title: string
  description: string
  status: ScenarioFeatureStatus
  /** Present only when status is Completed and the UI can navigate. */
  navigateTo?: ScenarioNavTab
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

/**
 * Admin module list: 12 completed + 4 pending = 16 items.
 * Pending items are shown disabled with a "Pending" label.
 */
export const ADMIN_SCENARIO_FEATURES: ScenarioFeature[] = [
  {
    id: 'financial-reports',
    title: 'Financial Reports',
    description: 'View financial summaries and performance metrics for the business.',
    status: 'Completed',
    navigateTo: 'reports',
    Icon: BanknotesIcon,
  },
  {
    id: 'staff-registration',
    title: 'Staff Registration and Role Management',
    description: 'Register staff accounts and assign Admin or Staff roles.',
    status: 'Completed',
    navigateTo: 'staff',
    Icon: UserPlusIcon,
  },
  {
    id: 'parts-management',
    title: 'Parts Management',
    description: 'Maintain the parts catalogue, pricing, and stock quantities.',
    status: 'Completed',
    navigateTo: 'parts',
    Icon: CubeIcon,
  },
  {
    id: 'purchase-invoice',
    title: 'Purchase Invoice Management',
    description: 'Record supplier purchases and linked invoice lines.',
    status: 'Completed',
    navigateTo: 'sales',
    Icon: ClipboardDocumentListIcon,
  },
  {
    id: 'customer-vehicle-reg',
    title: 'Customer Registration with Vehicle Details',
    description: 'Capture customers and associate vehicles with their profile.',
    status: 'Completed',
    navigateTo: 'customers',
    Icon: TruckIcon,
  },
  {
    id: 'sales-invoice',
    title: 'Sales and Invoice Management',
    description: 'Create sales, apply discounts, and generate customer invoices.',
    status: 'Completed',
    navigateTo: 'sales',
    Icon: DocumentTextIcon,
  },
  {
    id: 'customer-details-history',
    title: 'Customer Details and History Viewing',
    description: 'Open customer profiles with purchase and service history.',
    status: 'Completed',
    navigateTo: 'customers',
    Icon: EyeIcon,
  },
  {
    id: 'customer-reports',
    title: 'Customer Reports',
    description: 'Analyse customer activity, loyalty discounts, and segments.',
    status: 'Completed',
    navigateTo: 'reports',
    Icon: ChartPieIcon,
  },
  {
    id: 'customer-search',
    title: 'Customer Search',
    description: 'Find customers quickly by name from the customer directory.',
    status: 'Completed',
    navigateTo: 'customers',
    Icon: MagnifyingGlassIcon,
  },
  {
    id: 'customer-self-registration',
    title: 'Customer Self-Registration',
    description: 'Allow new customers to register through the public registration flow.',
    status: 'Completed',
    navigateTo: 'customers',
    Icon: IdentificationIcon,
  },
  {
    id: 'purchase-service-history',
    title: 'Purchase and Service History',
    description: 'Review past sales and service appointments per customer.',
    status: 'Completed',
    navigateTo: 'customers',
    Icon: ClockIcon,
  },
  {
    id: 'loyalty-program',
    title: 'Loyalty Program',
    description: 'Apply and display loyalty discounts on qualifying purchases.',
    status: 'Completed',
    navigateTo: 'customers',
    Icon: GiftIcon,
  },
  {
    id: 'vendor-management',
    title: 'Vendor Management',
    description: 'Manage supplier records, contacts, and procurement relationships.',
    status: 'Pending',
    Icon: BuildingStorefrontIcon,
  },
  {
    id: 'email-invoice',
    title: 'Email Invoice Sending',
    description: 'Send invoice PDFs and payment reminders by email.',
    status: 'Pending',
    Icon: EnvelopeIcon,
  },
  {
    id: 'appointments',
    title: 'Appointment and Service Requests',
    description: 'Schedule workshops and track service request workflows.',
    status: 'Completed',
    Icon: CalendarDaysIcon,
  },
  {
    id: 'low-stock-credit',
    title: 'Low Stock Notification and Credit Reminder System',
    description: 'Automated alerts for low inventory and credit follow-ups.',
    status: 'Pending',
    Icon: BellAlertIcon,
  },
]
