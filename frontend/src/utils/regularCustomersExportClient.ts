import jsPDF from 'jspdf'
import { APP_NAME } from '../lib/appBranding'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import type { RegularCustomerRow } from '../services/customerReportsApi'
import { formatMoney } from './formatUsd'

function formatRangeLabel(from: string, to: string) {
  if (from && to) return `${from} to ${to}`
  if (from) return `From ${from}`
  if (to) return `Through ${to}`
  return 'All dates'
}

export function exportRegularCustomersPdfClient(
  rows: RegularCustomerRow[],
  from: string,
  to: string,
) {
  const stamp = new Date().toISOString().slice(0, 10)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const generated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const totalPurchases = rows.reduce((s, r) => s + r.purchaseCount, 0)
  const avgOrder =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.averageOrderValue, 0) / rows.length
      : 0

  doc.setFontSize(18)
  doc.setTextColor(22, 163, 74)
  doc.text(APP_NAME, 40, 40)
  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59)
  doc.text('Regular Customers Report', 40, 58)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Date range: ${formatRangeLabel(from, to)}`, 40, 72)
  doc.text(`Generated: ${generated}`, 40, 84)
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(
    `Summary: ${rows.length} customers · ${totalPurchases} purchases · avg ${formatMoney(avgOrder)} per order`,
    40,
    98,
  )

  autoTable(doc, {
    startY: 110,
    head: [['Customer', 'Purchase Count', 'Avg. Value', 'Engagement Level']],
    body: rows.map((r) => [
      r.customerName,
      String(r.purchaseCount),
      formatMoney(r.averageOrderValue),
      r.engagementLevel,
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [22, 163, 74], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
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
  saveAs(blob, `regular-customers-report-${stamp}.pdf`)
}
