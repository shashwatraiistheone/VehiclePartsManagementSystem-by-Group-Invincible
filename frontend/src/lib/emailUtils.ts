export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isPlaceholderEmail(email?: string | null): boolean {
  return !email || email.trim().endsWith('@partshub.local')
}

/** Prompt user when profile email is missing; returns trimmed email or null if cancelled/invalid. */
export function resolveInvoiceEmail(profileEmail?: string | null): string | null {
  if (profileEmail && !isPlaceholderEmail(profileEmail) && isValidEmail(profileEmail)) {
    return profileEmail.trim()
  }
  const entered = window.prompt('Enter a valid customer email to send the invoice:')
  if (!entered) return null
  const trimmed = entered.trim()
  if (!isValidEmail(trimmed)) {
    return null
  }
  return trimmed
}
