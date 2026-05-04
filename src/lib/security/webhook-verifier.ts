// @ts-nocheck
/**
 * SETU — Webhook Signature Verifier
 *
 * Verifies HMAC-SHA256 signatures on incoming webhook callbacks.
 * Used for runtime callbacks from n8n and other providers.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/lib/env";

export interface WebhookVerifyResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verify an incoming webhook request signature.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export async function verifyWebhookSignature(
  request: Request,
  body: string
): Promise<WebhookVerifyResult> {
  const signature = request.headers.get("x-setu-signature");
  const timestamp = request.headers.get("x-setu-timestamp");

  if (!signature || !timestamp) {
    return { valid: false, reason: "Missing signature headers" };
  }

  // Reject requests older than 5 minutes
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) {
    return { valid: false, reason: "Request timestamp too old" };
  }

  const env = getServerEnv();
  const payload = `${timestamp}.${body}`;
  const expected = createHmac("sha256", env.WEBHOOK_SIGNING_SECRET)
    .update(payload)
    .digest("hex");

  const sigBuffer = Buffer.from(signature, "hex");
  const expBuffer = Buffer.from(expected, "hex");

  if (sigBuffer.length !== expBuffer.length) {
    return { valid: false, reason: "Signature length mismatch" };
  }

  const valid = timingSafeEqual(sigBuffer, expBuffer);
  return { valid, reason: valid ? undefined : "Signature mismatch" };
}
