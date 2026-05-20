import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Printer, X } from 'lucide-react'
import { APP_NAME } from '../lib/appBranding'
import { fetchCompanySettings, fetchSaleById, type CompanySettings, type SaleRecord } from '../services/salesApi'

function formatMoney(n: number) {
  return `Rs ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** App renders this page outside a Route, so read the id from the path (e.g. /invoice/print/42). */
function parseSaleIdFromPath(pathname: string): number | null {
  const match = pathname.match(/\/invoice\/print\/(\d+)/i)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

export default function PrintInvoicePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const saleId = useMemo(() => parseSaleIdFromPath(location.pathname), [location.pathname])
  const printRef = useRef<HTMLDivElement>(null)
  const [sale, setSale] = useState<SaleRecord | null>(null)
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (saleId == null) {
      setError('Invalid sale ID')
      setLoading(false)
      return
    }
    void (async () => {
      try {
        const [s, c] = await Promise.all([fetchSaleById(saleId), fetchCompanySettings()])
        setSale(s)
        setCompany(c)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    })()
  }, [saleId])

  function handlePrint() {
    window.print()
  }

  function handleExportPdf() {
    handlePrint()
  }

  if (loading) {
    return <p className="p-8 text-center text-slate-600">Loading invoice…</p>
  }

  if (error || !sale) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{error ?? 'Invoice not found'}</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-4 text-sm text-blue-600 underline">
          Go back
        </button>
      </div>
    )
  }

  const inv = sale.invoice
  const paymentStatus = inv?.paymentStatus ?? 'Credit'
  const dueDate = inv?.dueDate ? new Date(inv.dueDate) : null
  const invoiceDate = inv?.createdDate ? new Date(inv.createdDate) : new Date(sale.date)

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-root { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Invoice {sale.invoiceNumber}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            title="Use your browser print dialog and choose Save as PDF"
          >
            Save as PDF
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-6 print:p-0">
        <div ref={printRef} className="print-root rounded-xl border bg-white p-8 shadow-lg print:border-0 print:shadow-none">
          <header className="border-b border-slate-200 pb-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{company?.name ?? APP_NAME}</h2>
                {company?.address ? <p className="mt-1 text-sm text-slate-600">{company.address}</p> : null}
                <p className="mt-1 text-sm text-slate-600">
                  {company?.phone ? `Tel: ${company.phone}` : ''}
                  {company?.email ? ` · ${company.email}` : ''}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-lg font-bold text-blue-700">TAX INVOICE</p>
                <p className="mt-2">
                  <span className="font-semibold text-slate-700">Invoice #:</span> {sale.invoiceNumber}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Date:</span>{' '}
                  {invoiceDate.toLocaleDateString()}
                </p>
                {dueDate ? (
                  <p>
                    <span className="font-semibold text-slate-700">Due:</span> {dueDate.toLocaleDateString()}
                  </p>
                ) : null}
                <p>
                  <span className="font-semibold text-slate-700">Payment:</span> {paymentStatus}
                </p>
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
            <div>
              <h3 className="mb-2 font-semibold uppercase tracking-wide text-slate-500">Bill to</h3>
              <p className="font-semibold text-slate-900">{sale.customerName}</p>
              {sale.customerPhone ? <p className="text-slate-600">{sale.customerPhone}</p> : null}
              {sale.customerEmail ? <p className="text-slate-600">{sale.customerEmail}</p> : null}
              {sale.customerAddress ? <p className="text-slate-600">{sale.customerAddress}</p> : null}
            </div>
            <div className="sm:text-right">
              <h3 className="mb-2 font-semibold uppercase tracking-wide text-slate-500">Sale reference</h3>
              <p>Sale ID: {sale.id}</p>
              {inv?.paidAmount != null ? <p>Paid: {formatMoney(inv.paidAmount)}</p> : null}
              {inv?.balanceAmount != null ? <p>Balance: {formatMoney(inv.balanceAmount)}</p> : null}
            </div>
          </section>

          <table className="mt-8 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-800 text-left text-xs uppercase text-slate-600">
                <th className="py-2 pr-2">Item</th>
                <th className="py-2 pr-2 text-center">Qty</th>
                <th className="py-2 pr-2 text-right">Unit price</th>
                <th className="py-2 text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={`${item.partId}-${item.quantity}`} className="border-b border-slate-100">
                  <td className="py-2 pr-2">{item.partName}</td>
                  <td className="py-2 pr-2 text-center">{item.quantity}</td>
                  <td className="py-2 pr-2 text-right">{formatMoney(item.price)}</td>
                  <td className="py-2 text-right">{formatMoney(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span>{formatMoney(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Discount (loyalty)</span>
              <span className="text-emerald-700">
                {sale.discount > 0 ? `- ${formatMoney(sale.discount)}` : formatMoney(0)}
              </span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-lg font-bold">
              <span>Total due</span>
              <span>{formatMoney(sale.finalAmount)}</span>
            </div>
          </div>

          <footer className="mt-12 border-t pt-4 text-center text-xs text-slate-500">
            Thank you for your business. This invoice was generated from the {APP_NAME}.
          </footer>
        </div>
      </div>
    </>
  )
}
