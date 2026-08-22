// Server-side event capture — a plain fetch to PostHog's capture endpoint
// rather than the posthog-node SDK, since a single fire-and-forget POST is
// all these events need and it avoids another client to initialize on every
// serverless cold start. Uses the same project key as the client SDK (that
// key is meant to be public — it can only write events, not read data).
export async function trackServer(
  event: string,
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return // analytics is optional — never block the caller on this

  try {
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'
    await fetch(`${host}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: 'setu-server' },
      }),
    })
  } catch {
    // Analytics failures must never break the request they're attached to.
  }
}
