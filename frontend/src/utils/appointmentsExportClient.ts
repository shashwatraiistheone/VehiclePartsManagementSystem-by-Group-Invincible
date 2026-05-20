import jsPDF from 'jspdf'
import { APP_NAME } from '../lib/appBranding'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import type { Appointment, AppointmentsListResponse } from '../services/appointmentApi'
import { formatAppointmentDateTime, formatStatusLabel } from '../components/customer-portal/appointmentDisplay'

function formatRangeLabel(from: string, to: string) {
  if (from && to) return `${from} to ${to}`
  if (from) return `From ${from}`
  if (to) return `Through ${to}`
  return 'All dates'
}

export function exportAppointmentsPdfClient(
  report: AppointmentsListResponse,
  from: string,
  to: string,
) {
  const stamp = new Date().toISOString().slice(0, 10)
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
  doc.text('Manage Appointments Report', 40, 58)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Date range: ${formatRangeLabel(from, to)}`, 40, 72)
  doc.text(`Generated: ${generated}`, 40, 84)
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  doc.text(
    `Pending: ${report.summary.pending} · Confirmed: ${report.summary.confirmed} · Cancelled: ${report.summary.cancelled} · Completed: ${report.summary.completed}`,
    40,
    98,
  )

  autoTable(doc, {
    startY: 110,
    head: [['Date & Time', 'Customer', 'Vehicle', 'Service Type', 'Status']],
    body: report.items.map((r: Appointment) => {
      const { dateLabel, timeRange } = formatAppointmentDateTime(r.date)
      return [
        `${dateLabel}\n${timeRange}`,
        `${r.customerName}\n${r.customerPhone || '—'}`,
        `${r.vehicleMakeModel || '—'}\n${r.vehicleNumber || ''}`,
        r.serviceType,
        formatStatusLabel(r.status),
      ]
    }),
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    margin: { left: 40, right: 40 },
  })

  const blob = doc.output('blob')
  saveAs(blob, `appointments-report-${stamp}.pdf`)
}
