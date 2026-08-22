// Escapes user-supplied text before it's interpolated into an email's HTML
// template. Every Resend-sending route in this app builds HTML via template
// literals with raw ${name}/${email}/${company}/${useCase}/... — none of it
// was escaped, so a hire-form or cancel-reason submission containing HTML
// (e.g. a name of `<img src=x onerror=alert(1)>`) would execute in whatever
// mail client renders it (both the admin's inbox and, for confirmation
// emails, the prospect's own).
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
