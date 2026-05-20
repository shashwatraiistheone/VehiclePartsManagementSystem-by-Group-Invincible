/** Nepali Rupees — standard display for this app. */
export function formatRs(amount: number): string {
  return `Rs ${(Number.isFinite(amount) ? amount : 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** @deprecated Use formatRs — kept for existing imports. */
export function formatUsd(amount: number): string {
  return formatRs(amount)
}

/** Alias for formatRs — use for money display across the app. */
export function formatMoney(amount: number): string {
  return formatRs(amount)
}

export function formatPurchaseDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
