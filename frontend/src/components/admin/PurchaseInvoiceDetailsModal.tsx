import { useRef } from 'react'
import { Download, Eye, Printer, X } from 'lucide-react'
import type { PurchaseInvoice } from '../../services/purchaseApi'
import { formatPurchaseDate, formatUsd } from '../../utils/formatUsd'

type Props = {
  invoice: PurchaseInvoice
  onClose: () => void
}

export function PurchaseInvoiceDetailsModal({ invoice, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html><html><head><title>${invoice.invoiceNumber}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
        h1 { font-size: 1.5rem; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background: #f8fafc; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 16px 0; }
        .total { font-size: 1.25rem; font-weight: 700; color: #15803d; margin-top: 16px; }
      </style></head><body>${content.innerHTML}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  function handlePdfExport() {
    handlePrint()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-invoice-details-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <Eye className="h-5 w-5" />
            <h2 id="purchase-invoice-details-title" className="text-lg font-semibold">
              Invoice Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div ref={printRef} className="print-area">
            <h3 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h3>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Vendor" value={invoice.vendorName} />
              <Detail label="Purchase Date" value={formatPurchaseDate(invoice.purchaseDate)} />
              <Detail label="Processed By" value={invoice.processedBy || '—'} />
              <Detail
                label="Total Amount"
                value={formatUsd(invoice.totalAmount)}
                valueClassName="font-semibold text-emerald-600"
              />
            </div>
            {invoice.notes ? (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Notes: </span>
                {invoice.notes}
              </p>
            ) : null}

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Purchased Parts
            </h4>
            <table className="mt-2 min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Part</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit Price</th>
                  <th className="px-3 py-2">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.partId} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {item.partName || `Part #${item.partId}`}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{item.quantity}</td>
                    <td className="px-3 py-2 tabular-nums">{formatUsd(item.costPrice)}</td>
                    <td className="px-3 py-2 tabular-nums font-medium text-slate-800">
                      {formatUsd(item.quantity * item.costPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="total mt-4 text-right text-lg font-bold text-emerald-600">
              Total: {formatUsd(invoice.totalAmount)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <Printer className="h-4 w-4" />
            Printable Invoice
          </button>
          <button
            type="button"
            onClick={handlePdfExport}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-blue-500 hover:to-indigo-500"
          >
            <Download className="h-4 w-4" />
            PDF Export
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Detail({
  label,
  value,
  valueClassName = 'text-slate-800',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-0.5 ${valueClassName}`}>{value}</p>
    </div>
  )
}
