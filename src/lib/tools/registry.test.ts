import { describe, it, expect } from 'vitest'
import { TOOL_REGISTRY, TOOL_NAME_TO_SLUG, getTool, getToolsByCategory } from './registry'

// With ~95 hand-written entries, a duplicate slug or an empty required
// field is exactly the kind of silent copy-paste mistake that wouldn't
// fail a build (this file is @ts-nocheck) and would only surface the first
// time a real customer tried to connect that specific tool.

describe('TOOL_REGISTRY integrity', () => {
  it('has no duplicate slugs', () => {
    const slugs = TOOL_REGISTRY.map(t => t.slug)
    const unique = new Set(slugs)
    const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
    expect(dupes, `duplicate slugs: ${dupes.join(', ')}`).toEqual([])
    expect(unique.size).toBe(slugs.length)
  })

  it('every entry has every required field, non-empty', () => {
    const requiredFields: (keyof (typeof TOOL_REGISTRY)[number])[] = [
      'slug', 'name', 'domain', 'category', 'description',
      'authType', 'authLabel', 'authPlaceholder', 'authHint', 'baseUrl', 'docsUrl',
    ]
    for (const tool of TOOL_REGISTRY) {
      for (const field of requiredFields) {
        expect(tool[field], `${tool.slug ?? '(no slug)'}.${field}`).toBeTruthy()
      }
    }
  })

  it('every baseUrl is a well-formed URL (https, except documented on-prem/local exceptions), even with {placeholder} substituted', () => {
    // Tally (TallyPrime) genuinely runs on-premise on the customer's own
    // LAN — its description explicitly documents this as plain HTTP to a
    // local host, not a cloud API. Faking an https:// URL here would be
    // less honest than the real exception.
    const localNetworkExceptions = new Set(['tally'])
    for (const tool of TOOL_REGISTRY) {
      const substituted = tool.baseUrl.replace(/\{(\w+)\}/g, 'x')
      expect(() => new URL(substituted), `${tool.slug}: ${tool.baseUrl}`).not.toThrow()
      const expectedScheme = localNetworkExceptions.has(tool.slug) ? 'http://' : 'https://'
      expect(substituted.startsWith(expectedScheme), `${tool.slug}: ${tool.baseUrl}`).toBe(true)
    }
  })

  it('slugs are lowercase-kebab, matching the connect-flow/URL conventions used everywhere else', () => {
    for (const tool of TOOL_REGISTRY) {
      expect(tool.slug, tool.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('authType is one of the values buildAuthHeaders actually switches on', () => {
    const valid = ['api_key', 'bearer', 'basic', 'oauth', 'account_sid']
    for (const tool of TOOL_REGISTRY) {
      expect(valid, tool.slug).toContain(tool.authType)
    }
  })
})

describe('getTool / getToolsByCategory', () => {
  it('resolves a real slug', () => {
    expect(getTool('hubspot')?.name).toBe('HubSpot')
  })

  it('returns undefined for an unknown slug rather than throwing', () => {
    expect(getTool('not-a-real-tool')).toBeUndefined()
  })

  it('returns only tools in the requested category', () => {
    const results = getToolsByCategory('Scheduling')
    expect(results.length).toBeGreaterThan(0)
    for (const tool of results) expect(tool.category).toBe('Scheduling')
  })

  it('every newly-added category actually has at least one tool in it', () => {
    const newCategories = ['Scheduling', 'E-signature', 'Video & Meetings', 'Recruiting & ATS', 'Payroll & Expenses', 'Reviews & Reputation', 'Compliance & GRC', 'Data Warehouse'] as const
    for (const category of newCategories) {
      expect(getToolsByCategory(category as any).length, category).toBeGreaterThan(0)
    }
  })
})

describe('TOOL_NAME_TO_SLUG', () => {
  it('every mapped slug resolves to a real registry entry — catches a typo on either side of the map', () => {
    for (const [displayName, slug] of Object.entries(TOOL_NAME_TO_SLUG)) {
      expect(getTool(slug), `"${displayName}" -> "${slug}"`).toBeDefined()
    }
  })
})
