import { describe, it, expect } from 'vitest'
import { escapeHtml } from './escape-html'

// Every Resend-sending route interpolates raw user input (name, email,
// company, cancel/rejection reasons) into HTML email templates via this
// function. A regression here reopens the exact HTML-injection hole fixed
// across the transactional email routes.

describe('escapeHtml', () => {
  it('escapes all 5 HTML-significant characters', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml(`"quoted"`)).toBe('&quot;quoted&quot;')
    expect(escapeHtml(`it's`)).toBe('it&#39;s')
  })

  it('neutralizes a realistic injection payload from a hire-form name field', () => {
    const payload = '<img src=x onerror=alert(document.cookie)>'
    const escaped = escapeHtml(payload)
    expect(escaped).not.toContain('<img')
    expect(escaped).not.toContain('<')
    expect(escaped).not.toContain('>')
  })

  it('returns an empty string for null and undefined rather than the literal words', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('coerces non-string values to string first', () => {
    expect(escapeHtml(42)).toBe('42')
    expect(escapeHtml(true)).toBe('true')
  })

  it('leaves plain text with no special characters unchanged', () => {
    expect(escapeHtml('Jane Smith, Acme Inc')).toBe('Jane Smith, Acme Inc')
  })

  it('escapes ampersands exactly once — does not double-escape', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
    expect(escapeHtml('Tom & Jerry')).not.toContain('&amp;amp;')
  })
})
