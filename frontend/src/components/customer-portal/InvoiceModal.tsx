import { Printer, X } from 'lucide-react'
import { APP_NAME, APP_TAGLINE } from '../../lib/appBranding'
import type { CustomerHistory } from '../../services/customerApi'
import { formatDate, formatMoney } from './shared'

type Purchase = CustomerHistory['purchases'][number]

type Props = {
  purchase: Purchase
  customerName: string
  onClose: () => void
}

export function InvoiceModal({ purchase, customerName, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4 print:hidden">
          <h3 className="font-semibold text-slate-900">Invoice — Sale #{purchase.saleId}</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 text-sm" id="customer-invoice-print">
          <div className="mb-6 border-b pb-4">
            <p className="text-lg font-bold text-slate-900">{APP_NAME}</p>
            <p className="text-slate-500">{APP_TAGLINE}</p>
          </div>
          <p className="mb-1">
            <span className="text-slate-500">Customer:</span> {customerName}
          </p>
          <p className="mb-4">
            <span className="text-slate-500">Date:</span> {formatDate(purchase.date)}
          </p>
          <table className="mb-4 w-full text-left">
            <thead>
              <tr className="border-b text-xs uppercase text-slate-500">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item) => (
                <tr key={`${item.partId}-${item.price}`} className="border-b border-slate-100">
                  <td className="py-2">{item.partName || `Part #${item.partId}`}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{formatMoney(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-1 text-right">
            <p>Subtotal: {formatMoney(purchase.totalAmount)}</p>
            {purchase.discount > 0 ? (
              <p className="text-emerald-600">Loyalty discount: −{formatMoney(purchase.discount)}</p>
            ) : null}
            <p className="text-lg font-bold text-slate-900">Total: {formatMoney(purchase.finalAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
