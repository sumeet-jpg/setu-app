/**
 * SETU — Environment Validation
 *
 * This module validates and exports typed environment variables.
 *
 * RULES:
 * - Server env is imported only in server components, API routes, and lib files.
 * - Client env (NEXT_PUBLIC_*) is safe to import anywhere.
 * - This file must NEVER be imported in client components.
 * - Secrets are NEVER logged, even on validation failure.
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────
// Server-side schema — validated at startup, never sent to client
// ─────────────────────────────────────────────────────────────
const serverEnvSchema = z.object({
  // Supabase server
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
  SUPABASE_PROJECT_REF: z.string().min(1, "SUPABASE_PROJECT_REF is required"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid connection URL"),

  // LLM — never expose keys
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  PRIMARY_REASONING_MODEL: z.string().min(1).default("gpt-4o"),
  FAST_MODEL: z.string().min(1).default("gpt-4o-mini"),
  FALLBACK_REASONING_MODEL: z.string().min(1).default("claude-sonnet-4-20250514"),
  DEFAULT_LLM_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),

  // Email
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  FROM_EMAIL: z.string().min(1).default("Setu <admin@setuagents.com>"),
  ADMIN_ALERT_EMAIL: z.string().email().default("admin@setuagents.com"),

  // App secrets
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters"),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"),
  WEBHOOK_SIGNING_SECRET: z.string().min(32, "WEBHOOK_SIGNING_SECRET must be at least 32 characters"),

  // Runtime governance
  RUNTIME_MODE: z.string().default("control_plane_only"),
  RUNTIME_EXECUTION_ENABLED: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  RUNTIME_PROVIDER: z.string().default("n8n"),
  RUNTIME_PROVIDER_ACTIVATION_STATUS: z.string().default("pending_upgrade"),

  // Storage
  SUPABASE_STORAGE_BUCKET_BLUEPRINTS: z.string().default("blueprints"),
  SUPABASE_STORAGE_BUCKET_UPLOADS: z.string().default("uploads"),
  SUPABASE_STORAGE_BUCKET_SANDBOX: z.string().default("sandbox-files"),

  // Governance defaults
  FILE_DELETE_REQUIRES_ADMIN_APPROVAL: z
    .string()
    .transform((v) => v !== "false")
    .default("true"),
  FILE_EXTERNAL_SHARE_REQUIRES_ADMIN_APPROVAL: z
    .string()
    .transform((v) => v !== "false")
    .default("true"),
  FILE_PERMISSION_CHANGE_REQUIRES_ADMIN_APPROVAL: z
    .string()
    .transform((v) => v !== "false")
    .default("true"),
  FILE_BULK_DELETE_RESTRICTED: z
    .string()
    .transform((v) => v !== "false")
    .default("true"),
});

// ─────────────────────────────────────────────────────────────
// Client-side schema — only NEXT_PUBLIC_* vars
// ─────────────────────────────────────────────────────────────
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("https://setuagents.com"),
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

// ─────────────────────────────────────────────────────────────
// Validate server env — only runs server-side
// Logs field names only, NEVER logs values
// ─────────────────────────────────────────────────────────────
function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join("."));
    // Log field names only — never log values
    console.error(
      "[Setu] Server env validation failed. Missing or invalid fields:",
      missing
    );
    throw new Error(
      `[Setu] Missing required server environment variables: ${missing.join(", ")}`
    );
  }
  return result.data;
}

// ─────────────────────────────────────────────────────────────
// Validate client env — safe to run anywhere
// ─────────────────────────────────────────────────────────────
function validateClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join("."));
    console.error("[Setu] Client env validation failed:", missing);
    throw new Error(
      `[Setu] Missing required public environment variables: ${missing.join(", ")}`
    );
  }
  return result.data;
}

// ─────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────

/**
 * Server environment — import ONLY in server components, API routes, and lib.
 * Never import in client components or pages that render on the client.
 */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error(
      "[Setu] getServerEnv() called on the client. This is a security violation."
    );
  }
  return validateServerEnv();
}

/**
 * Client environment — safe to import anywhere.
 */
export const clientEnv = validateClientEnv();

/**
 * Runtime is currently disabled. Always check before any execution attempt.
 */
export function isRuntimeExecutionEnabled(): boolean {
  if (typeof window !== "undefined") return false;
  try {
    const env = getServerEnv();
    return env.RUNTIME_EXECUTION_ENABLED === true;
  } catch {
    return false;
  }
}
