import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Mail,
  DollarSign,
  CheckCircle,
  Calendar,
  Search,
  RefreshCw,
  FileText,
  Check,
  Phone,
  Clock
} from 'lucide-react'
import { getInvoices, markInvoiceAsPaid, sendInvoiceReminder, getToken, type Invoice } from '../../api'

export function CreditManagementPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = getToken()
      if (!token) return
      const data = await getInvoices(token)
      setInvoices(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handlePay = async (id: number) => {
    if (!window.confirm('Are you sure you want to mark this invoice as Paid? This action is irreversible.')) return
    try {
      setActionLoading(id)
      setActionMessage(null)
      const token = getToken()
      if (!token) return
      await markInvoiceAsPaid(token, id)
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, isPaid: true } : inv))
      )
      setActionMessage({ type: 'success', text: 'Invoice successfully marked as Paid!' })
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Payment update failed' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReminder = async (id: number) => {
    try {
      setActionLoading(id)
      setActionMessage(null)
      const token = getToken()
      if (!token) return
      const res = await sendInvoiceReminder(token, id)
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id
            ? {
                ...inv,
                reminderSentCount: inv.reminderSentCount + 1,
                lastReminderDate: new Date().toISOString()
              }
            : inv
        )
      )
      setActionMessage({ type: 'success', text: res.message || 'Reminder email successfully sent!' })
    } catch (err) {
      setActionMessage({ type: 'error', text: err instanceof Error ? err.message : 'Sending reminder failed' })
    } finally {
      setActionLoading(null)
    }
  }

  // Helper to check if invoice is older than 30 days
  const isOverdue = (inv: Invoice) => {
    if (inv.isPaid) return false
    const created = new Date(inv.createdDate)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return created < thirtyDaysAgo
  }

  // Derived metrics
  const unpaidInvoices = invoices.filter((inv) => !inv.isPaid)
  const totalOutstandingAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.sale?.totalAmount ?? 0), 0)
  
  const overdueInvoices = unpaidInvoices.filter((inv) => isOverdue(inv))
  const overdueCount = overdueInvoices.length
  
  const totalRemindersCount = invoices.reduce((sum, inv) => sum + inv.reminderSentCount, 0)

  // Filters & Search
  const filteredInvoices = invoices
    .filter((inv) => {
      if (filter === 'paid') return inv.isPaid
      if (filter === 'unpaid') return !inv.isPaid
      if (filter === 'overdue') return isOverdue(inv)
      return true
    })
    .filter((inv) => {
      const term = searchTerm.toLowerCase()
      const invNum = inv.invoiceNumber.toLowerCase()
      const custName = inv.sale?.customer?.name.toLowerCase() ?? ''
      return invNum.includes(term) || custName.includes(term)
    })

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Credit Management & Ledger</h1>
          <p className="mt-1 text-sm text-slate-500">Track outstanding credits, customer invoices, and overdue accounts.</p>
        </div>
        <button
          type="button"
          onClick={fetchInvoices}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700">Total Outstanding Credit</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900">Rs {totalOutstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="mt-1 text-xs text-blue-600/80">{unpaidInvoices.length} invoices unpaid</p>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-red-700">Overdue Credits (&gt;30 Days)</span>
            <div className="rounded-lg bg-red-100 p-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900">{overdueCount} Invoices</h3>
            <p className="mt-1 text-xs text-red-600/80">Requires immediate attention</p>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-purple-700">Reminders Triggered</span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
              <Mail className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900">{totalRemindersCount} Sent</h3>
            <p className="mt-1 text-xs text-purple-600/80">Active email tracking</p>
          </div>
        </div>
      </div>

      {/* Action Notification Message banner */}
      {actionMessage && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 border ${
            actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {actionMessage.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {actionMessage.text}
          </div>
          <button
            type="button"
            className="text-xs font-semibold underline hover:no-underline"
            onClick={() => setActionMessage(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar (Search, Filters) */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-10 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'unpaid', label: 'Outstanding' },
            { id: 'overdue', label: 'Overdue Credit (>30 Days)' },
            { id: 'paid', label: 'Paid Invoices' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                filter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Ledger Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-4 text-sm font-medium text-slate-500">Loading invoice ledger...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500 animate-bounce" />
            <p className="mt-4 text-sm font-semibold text-slate-800">Error retrieving ledger</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={fetchInvoices}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-700">No invoices found</p>
            <p className="mt-1 text-xs text-slate-400">No records match the current filter or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Invoice No.</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Customer Details</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Invoice Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Due Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Amount</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Reminders</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                {filteredInvoices.map((inv) => {
                  const cust = inv.sale?.customer
                  const isPaid = inv.isPaid
                  const isInvOverdue = isOverdue(inv)
                  const isActioning = actionLoading === inv.id

                  const dueDate = new Date(inv.createdDate)
                  dueDate.setDate(dueDate.getDate() + 30)

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition font-medium">
                      {/* Invoice No */}
                      <td className="px-6 py-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          {inv.invoiceNumber}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-6 py-4">
                        {cust ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800">{cust.name}</p>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {cust.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {cust.phone}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Anonymous Customer</span>
                        )}
                      </td>

                      {/* Invoice Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(inv.createdDate).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {dueDate.toLocaleDateString()}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                        Rs {(inv.sale?.totalAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                            <CheckCircle className="h-3 w-3" />
                            Paid
                          </span>
                        ) : isInvOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-800 border border-red-200 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            Overdue Credit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                            <Clock className="h-3 w-3" />
                            Outstanding
                          </span>
                        )}
                      </td>

                      {/* Reminder status */}
                      <td className="px-6 py-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-700">
                            {inv.reminderSentCount} sent
                          </p>
                          {inv.lastReminderDate && (
                            <p className="text-[10px] text-slate-400">
                              Last: {new Date(inv.lastReminderDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <>
                              {isInvOverdue && (
                                <button
                                  type="button"
                                  onClick={() => handleReminder(inv.id)}
                                  disabled={isActioning}
                                  title="Send Email Reminder"
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                >
                                  {isActioning ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Mail className="h-3.5 w-3.5" />
                                  )}
                                  Remind
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handlePay(inv.id)}
                                disabled={isActioning}
                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow hover:bg-blue-700 transition disabled:opacity-50"
                              >
                                {isActioning ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Mark Paid
                              </button>
                            </>
                          )}

                          {isPaid && (
                            <span className="text-xs font-medium text-slate-400">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
