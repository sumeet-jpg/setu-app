// @ts-nocheck
/**
 * SETU — Rate Limiter
 *
 * Simple in-memory sliding window rate limiter.
 * Protects LLM-backed API routes from abuse.
 *
 * Limits:
 * - conversation start: 10 per hour per IP
 * - message send: 60 per hour per IP
 * - lead capture: 5 per hour per IP
 * - admin routes: 200 per hour per user
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(config.key);

  if (!entry || entry.resetAt < now) {
    store.set(config.key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "unknown";
}

// Pre-built limiters for each route type
export const RATE_LIMITS = {
  conversationStart: (ip: string) => checkRateLimit({
    key: `conv_start:${ip}`,
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),
  messageSend: (ip: string) => checkRateLimit({
    key: `msg_send:${ip}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  }),
  leadCapture: (ip: string) => checkRateLimit({
    key: `lead:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  }),
  adminRoute: (userId: string) => checkRateLimit({
    key: `admin:${userId}`,
    limit: 200,
    windowMs: 60 * 60 * 1000,
  }),
};
