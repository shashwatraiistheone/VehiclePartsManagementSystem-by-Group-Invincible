import { ArrowLeft, FileQuestion } from 'lucide-react'
import type { AdminPageId } from '../../admin/adminPages'

type Props = {
  title: string
  description: string
  onBack?: () => void
  backLabel?: string
}

export function AdminSaasPlaceholder({ title, description, onBack, backLabel = 'Back to Home' }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
      ) : null}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function adminPlaceholderCopy(id: AdminPageId): { title: string; description: string } {
  const map: Partial<Record<AdminPageId, { title: string; description: string }>> = {
    'search-sale': {
      title: 'Search & Sale',
      description: 'Search customers and parts, then attach line items to a sale. Connect this view to your sales API.',
    },
    'register-customer': {
      title: 'Register Customer',
      description: 'Capture customer and vehicle details for walk-ins. Use Manage Customers for the full directory.',
    },
    'sales-history': {
      title: 'Sales History',
      description: 'Browse past invoices, filters, and payment status. Wire to your sales and invoice endpoints.',
    },
    'credit-management': {
      title: 'Credit Management',
      description: 'Track credit limits, balances, and reminders for account customers.',
    },
    'customer-reports': {
      title: 'Customer Reports',
      description: 'Exports and charts for customer activity, segments, and loyalty metrics.',
    },
    'generate-invoice': {
      title: 'Generate Invoice',
      description: 'Create a new invoice from cart or service job. Integrate with your billing workflow.',
    },
    'staff-management': {
      title: 'Manage Staff',
      description: 'Register staff accounts and assign Admin or Staff roles. Hook up to your user administration API.',
    },
  }
  return (
    map[id] ?? {
      title: 'Section',
      description: 'This area is ready for your API-backed implementation.',
    }
  )
}
