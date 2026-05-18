import { ReceiptText } from 'lucide-react'

type InvoiceLine = {
  name: string
  unitPrice: number
  quantity: number
}

type Props = {
  customerName: string
  lines: InvoiceLine[]
}

export function Invoice({ customerName, lines }: Props) {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const discount = subtotal > 5000 ? Math.round(subtotal * 0.1) : 0
  const total = subtotal - discount

  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <ReceiptText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-900">Invoice</h3>
      </div>
      <p className="text-sm text-slate-600">Customer: {customerName || '—'}</p>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Part</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Unit price</th>
              <th className="px-3 py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-5 text-center text-slate-500">
                  No items selected.
                </td>
              </tr>
            ) : (
              lines.map((line) => (
                <tr key={line.name}>
                  <td className="px-3 py-2 text-slate-800">{line.name}</td>
                  <td className="px-3 py-2 text-slate-600">{line.quantity}</td>
                  <td className="px-3 py-2 text-slate-600">Rs {line.unitPrice.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-slate-900">
                    Rs {(line.unitPrice * line.quantity).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>Rs {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Discount (Feature 16)</span>
          <span className={discount > 0 ? 'font-semibold text-emerald-700' : ''}>
            - Rs {discount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
          <span>Total</span>
          <span>Rs {total.toLocaleString()}</span>
        </div>
      </div>
      {discount > 0 ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          Loyalty discount applied because invoice total exceeded Rs 5,000.
        </p>
      ) : null}
    </div>
  )
}
