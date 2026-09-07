// @ts-nocheck
// ── Customer-supplied AI provider keys (BYOK) ────────────────────────────────
// Once hired, a customer can connect their own Anthropic key so real task
// execution runs — and is billed — on their own account instead of Setu's
// shared, capped key. Same encryption pattern as tool_connections
// (src/lib/tools/crypto.ts: AES-256-GCM, per-record IV) — this is exactly
// as sensitive as a third-party tool credential, so it gets the same
// treatment: encrypted at rest, never returned to the client, purged
// immediately (not on a grace window) on account deletion.

import Anthropic from '@anthropic-ai/sdk'
import { encrypt, decrypt } from '@/lib/tools/crypto'

export type AiProvider = 'anthropic'

export interface CustomerAiKey {
  provider: AiProvider
  connectedAt: string
  lastUsedAt: string | null
  model: string | null
}

// Cheap, real validation — a customer pasting a typo'd or revoked key should
// find out immediately, not on their first real task days later. Costs a
// fraction of a cent per check.
export async function verifyAnthropicKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = new Anthropic({ apiKey })
    await client.messages.create({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    })
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Could not verify this key with Anthropic.' }
  }
}

export async function saveCustomerAiKey(supabase: any, userId: string, provider: AiProvider, apiKey: string) {
  await supabase.from('customer_ai_keys').upsert({
    user_id: userId,
    provider,
    encrypted_key: encrypt(apiKey),
    connected_at: new Date().toISOString(),
  })
}

export async function getCustomerAiKeyStatus(supabase: any, userId: string, provider: AiProvider): Promise<CustomerAiKey | null> {
  const { data } = await supabase
    .from('customer_ai_keys')
    .select('provider, connected_at, last_used_at, model')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()
  if (!data) return null
  return { provider: data.provider, connectedAt: data.connected_at, lastUsedAt: data.last_used_at, model: data.model }
}

// Decrypted key for actual use in the execute loop — never sent to the
// client, only used server-side to instantiate an Anthropic client.
export async function getDecryptedCustomerAiKey(supabase: any, userId: string, provider: AiProvider): Promise<string | null> {
  const { data } = await supabase
    .from('customer_ai_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()
  if (!data) return null
  try {
    return decrypt(data.encrypted_key)
  } catch {
    return null
  }
}

export async function touchCustomerAiKeyUsage(supabase: any, userId: string, provider: AiProvider) {
  await supabase
    .from('customer_ai_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider)
}

export async function deleteCustomerAiKey(supabase: any, userId: string, provider: AiProvider) {
  await supabase.from('customer_ai_keys').delete().eq('user_id', userId).eq('provider', provider)
}
