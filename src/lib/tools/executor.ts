// @ts-nocheck
// ── Setu Tool Executor ────────────────────────────────────────────────────────
// Makes real HTTP calls to connected tool APIs using the user's decrypted key.
// Claude calls http_request → this file executes it → result returned to Claude.

import { getTool } from './registry'
import { decrypt } from './crypto'

export interface HttpRequestParams {
  tool: string        // tool slug from registry
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string        // e.g. '/campaigns' or '/crm/v3/objects/contacts'
  body?: Record<string, unknown>
  query?: Record<string, string>
  extra_headers?: Record<string, string>
}

export interface ExecutorResult {
  ok: boolean
  status: number
  data: unknown
  error?: string
}

// Parse the stored config: some tools need datacenter, subdomain, store name, etc.
function buildBaseUrl(baseUrl: string, config: Record<string, string>): string {
  return baseUrl.replace(/\{(\w+)\}/g, (_, key) => config[key] ?? '')
}

// Build auth headers from encrypted key + tool def
function buildAuthHeaders(
  authType: string,
  rawKey: string,
  config: Record<string, string>
): Record<string, string> {
  switch (authType) {
    case 'bearer':
      return { Authorization: `Bearer ${rawKey}` }

    case 'api_key': {
      // Some tools use X-Api-Key, others use a query param (handled separately)
      const header = config.api_key_header ?? 'X-Api-Key'
      return { [header]: rawKey }
    }

    case 'basic': {
      // rawKey is expected as "username:password" or just "key" (then use "apikey" as username)
      const [user, pass] = rawKey.includes(':') ? rawKey.split(':') : ['apikey', rawKey]
      const encoded = Buffer.from(`${user}:${pass}`).toString('base64')
      return { Authorization: `Basic ${encoded}` }
    }

    case 'account_sid': {
      // Twilio pattern: "AccountSID:AuthToken"
      const [sid, token] = rawKey.split(':')
      const encoded = Buffer.from(`${sid}:${token}`).toString('base64')
      return { Authorization: `Basic ${encoded}` }
    }

    case 'oauth':
      // Token already retrieved externally and stored as bearer
      return { Authorization: `Bearer ${rawKey}` }

    default:
      return { Authorization: `Bearer ${rawKey}` }
  }
}

// Special per-tool auth overrides (Mailchimp, Semrush, etc.)
function applyToolOverrides(
  slug: string,
  rawKey: string,
  headers: Record<string, string>,
  query: Record<string, string>
): { headers: Record<string, string>; query: Record<string, string> } {
  switch (slug) {
    case 'mailchimp': {
      // Mailchimp uses Basic auth with "apikey" as the username
      const encoded = Buffer.from(`apikey:${rawKey}`).toString('base64')
      return { headers: { ...headers, Authorization: `Basic ${encoded}` }, query }
    }
    case 'semrush': {
      // Semrush passes key as query param
      const { Authorization, ...rest } = headers
      return { headers: rest, query: { ...query, key: rawKey } }
    }
    case 'pipedrive': {
      const { Authorization, ...rest } = headers
      return { headers: rest, query: { ...query, api_token: rawKey } }
    }
    case 'datadog': {
      const [apiKey, appKey] = rawKey.split(':')
      return {
        headers: {
          ...headers,
          'DD-API-KEY': apiKey,
          'DD-APPLICATION-KEY': appKey ?? '',
        },
        query,
      }
    }
    case 'clevertap': {
      const [accountId, passcode] = rawKey.split(':')
      return {
        headers: {
          ...headers,
          'X-CleverTap-Account-Id': accountId,
          'X-CleverTap-Passcode': passcode ?? '',
        },
        query,
      }
    }
    case 'payu': {
      const [merchantKey, salt] = rawKey.split(':')
      return {
        headers: {
          ...headers,
          'merchant-key': merchantKey,
        },
        query,
      }
    }
    default:
      return { headers, query }
  }
}

export async function executeHttpRequest(
  params: HttpRequestParams,
  encryptedKey: string,
  config: Record<string, string> = {}
): Promise<ExecutorResult> {
  const toolDef = getTool(params.tool)
  if (!toolDef) {
    return { ok: false, status: 400, data: null, error: `Unknown tool: ${params.tool}` }
  }

  let rawKey: string
  try {
    rawKey = decrypt(encryptedKey)
  } catch {
    return { ok: false, status: 401, data: null, error: 'Failed to decrypt API key — key may be corrupted' }
  }

  const baseUrl = buildBaseUrl(toolDef.baseUrl, config)

  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...buildAuthHeaders(toolDef.authType, rawKey, config),
  }
  let query: Record<string, string> = { ...(params.query ?? {}) }

  ;({ headers, query } = applyToolOverrides(params.tool, rawKey, headers, query))

  // Notion requires Notion-Version header
  if (params.tool === 'notion') {
    headers['Notion-Version'] = '2022-06-28'
  }

  // Build full URL
  const url = new URL(baseUrl + params.path)
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v)
  }

  try {
    const response = await fetch(url.toString(), {
      method: params.method,
      headers,
      ...(params.body && params.method !== 'GET'
        ? { body: JSON.stringify(params.body) }
        : {}),
    })

    const contentType = response.headers.get('content-type') ?? ''
    let data: unknown
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? undefined : `HTTP ${response.status}: ${JSON.stringify(data).slice(0, 300)}`,
    }
  } catch (err: any) {
    return { ok: false, status: 0, data: null, error: err.message ?? 'Network error' }
  }
}
