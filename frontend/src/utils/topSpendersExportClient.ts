import jsPDF from 'jspdf'
import { APP_NAME } from '../lib/appBranding'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { TopSpenderRow } from '../services/customerReportsApi'
import type { TopSpendersExportFormat } from '../services/customerReportsApi'
import { formatMoney } from './formatUsd'

function fileStamp() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string | null) {
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

function rankedRows(rows: TopSpenderRow[]) {
  return rows.map((row, index) => ({
    rank: index + 1,
    ...row,
  }))
}

export function exportTopSpendersClient(
  format: TopSpendersExportFormat,
  rows: TopSpenderRow[],
  from: string,
  to: string,
) {
  const ranked = rankedRows(rows)
  const stamp = fileStamp()
  const range = formatRangeLabel(from, to)

  if (format === 'csv') {
    const headers = ['Rank', 'Customer Name', 'Total Spent', 'Total Purchases', 'Last Purchase Date']
    const lines = [
      headers.join(','),
      ...ranked.map((r) =>
        [
          r.rank,
          `"${r.customerName.replace(/"/g, '""')}"`,
          r.totalSpent.toFixed(2),
          r.purchaseCount,
          formatDate(r.lastPurchaseDate),
        ].join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `top-spenders-report-${stamp}.csv`)
    return
  }

  if (format === 'excel') {
    const sheetRows = ranked.map((r) => ({
      Rank: r.rank,
      'Customer Name': r.customerName,
      'Total Spent': r.totalSpent,
      'Total Purchases': r.purchaseCount,
      'Last Purchase Date': r.lastPurchaseDate ? formatDate(r.lastPurchaseDate) : '—',
    }))
    const ws = XLSX.utils.json_to_sheet(sheetRows)
    ws['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Top Spenders Report')
    XLSX.writeFile(wb, `top-spenders-report-${stamp}.xlsx`)
    return
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const generated = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  doc.setFontSize(18)
  doc.setTextColor(37, 99, 235)
  doc.text(APP_NAME, 40, 40)
  doc.setFontSize(14)
  doc.setTextColor(30, 41, 59)
  doc.text('Top Spenders Report', 40, 58)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Date range: ${range}`, 40, 72)
  doc.text(`Generated: ${generated}`, 40, 84)

  const totalSpent = rows.reduce((s, r) => s + r.totalSpent, 0)
  const totalPurchases = rows.reduce((s, r) => s + r.purchaseCount, 0)
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(
    `Summary: ${rows.length} customers · ${formatMoney(totalSpent)} combined spend · ${totalPurchases} purchases`,
    40,
    98,
  )

  autoTable(doc, {
    startY: 110,
    head: [['Rank', 'Customer', 'Total Spent', 'Purchases', 'Last Purchase']],
    body: ranked.map((r) => [
      String(r.rank),
      r.customerName,
      formatMoney(r.totalSpent),
      String(r.purchaseCount),
      formatDate(r.lastPurchaseDate),
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
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

  doc.save(`top-spenders-report-${stamp}.pdf`)
}
