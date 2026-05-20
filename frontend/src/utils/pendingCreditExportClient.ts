import jsPDF from 'jspdf'
import { APP_NAME } from '../lib/appBranding'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import type { PendingCreditRow, PendingCreditsReport } from '../services/customerReportsApi'
import { formatMoney } from './formatUsd'

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRangeLabel(from: string, to: string) {
  if (from && to) return `${from} to ${to}`
  if (from) return `From ${from}`
  if (to) return `Through ${to}`
  return 'All dates'
}

export function exportPendingCreditPdfClient(
  report: PendingCreditsReport,
  from: string,
  to: string,
) {
  const stamp = new Date().toISOString().slice(0, 10)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const generated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const currentCount = report.items.filter((r) => r.agingBucket === 'current').length
  const warningCount = report.items.filter((r) => r.agingBucket === 'warning').length
  const overdueCount = report.items.filter((r) => r.agingBucket === 'overdue').length

  doc.setFontSize(18)
  doc.setTextColor(220, 38, 38)
  doc.text(APP_NAME, 40, 40)
  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59)
  doc.text('Pending Credit Report', 40, 58)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Date range: ${formatRangeLabel(from, to)}`, 40, 72)
  doc.text(`Generated: ${generated}`, 40, 84)
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(
    `Outstanding Total: ${formatMoney(report.outstandingTotal)} · Invoices: ${report.items.length} · Current: ${currentCount} · Warning: ${warningCount} · Overdue: ${overdueCount}`,
    40,
    98,
  )

  autoTable(doc, {
    startY: 110,
    head: [['Invoice #', 'Customer', 'Amount Due', 'Sales Date', 'Days Outstanding', 'Phone']],
    body: report.items.map((r: PendingCreditRow) => [
      r.invoiceNumber,
      r.customerName,
      formatMoney(r.outstandingAmount),
      formatDate(r.salesDate),
      String(r.daysOutstanding),
      r.customerPhone || '—',
    ]),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [220, 38, 38], textColor: 255 },
    alternateRowStyles: { fillColor: [255, 241, 242] },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `${APP_NAME} · Confidential · Page ${data.pageNumber} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: 'center' },
      )
    },
  })

  const blob = doc.output('blob')
  saveAs(blob, `pending-credit-report-${stamp}.pdf`)
}
