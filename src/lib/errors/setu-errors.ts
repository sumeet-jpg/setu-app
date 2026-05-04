/**
 * SETU — Centralized Error Handling
 *
 * All API errors must use SetuError codes so the frontend
 * and admin audit trails can parse them consistently.
 *
 * RULE: Never include raw secrets, stack traces, or internal paths
 * in error responses sent to clients.
 */

export const SETU_ERROR_CODES = {
  // Input
  INPUT_MISSING: "input_missing",
  INPUT_INVALID: "input_invalid",

  // Matching
  LOW_CONFIDENCE: "low_confidence",
  CATALOG_NO_MATCH: "catalog_no_match",

  // Availability
  TOOL_UNAVAILABLE: "tool_unavailable",
  RUNTIME_NOT_CONNECTED: "runtime_not_connected",

  // Access
  PERMISSION_DENIED: "permission_denied",
  UNAUTHORIZED: "unauthorized",

  // Governance
  POLICY_VIOLATION: "policy_violation",
  APPROVAL_REQUIRED: "approval_required",
  HUMAN_APPROVAL_REQUIRED: "human_approval_required",
  KILL_SWITCH_ACTIVE: "kill_switch_active",
  UNSAFE_ACTION_REQUESTED: "unsafe_action_requested",
  DUPLICATE_ACTION_DETECTED: "duplicate_action_detected",

  // Cost
  COST_LIMIT_REACHED: "cost_limit_reached",
  RATE_LIMIT: "rate_limit",

  // System
  LLM_ERROR: "llm_error",
  TIMEOUT: "timeout",
  EXTERNAL_API_ERROR: "external_api_error",
  DATABASE_ERROR: "database_error",
  FILE_ACCESS_ERROR: "file_access_error",
  UNKNOWN_ERROR: "unknown_error",
} as const;

export type SetuErrorCode =
  (typeof SETU_ERROR_CODES)[keyof typeof SETU_ERROR_CODES];

export interface SetuErrorDetail {
  code: SetuErrorCode;
  message: string;
  safe_next_step: string;
  escalation_required: boolean;
  audit_log_id?: string;
}

export interface SetuApiError {
  ok: false;
  error: SetuErrorDetail;
}

export interface SetuApiSuccess<T = unknown> {
  ok: true;
  data: T;
}

export type SetuApiResponse<T = unknown> = SetuApiSuccess<T> | SetuApiError;

/**
 * Build a standardized error response.
 * Never include internal details (stack, file paths, raw DB errors).
 */
export function buildErrorResponse(
  code: SetuErrorCode,
  message: string,
  options?: {
    safe_next_step?: string;
    escalation_required?: boolean;
    audit_log_id?: string;
  }
): SetuApiError {
  return {
    ok: false,
    error: {
      code,
      message,
      safe_next_step:
        options?.safe_next_step ??
        "Please try again or contact support if the problem persists.",
      escalation_required: options?.escalation_required ?? false,
      audit_log_id: options?.audit_log_id,
    },
  };
}

/**
 * Build a standardized success response.
 */
export function buildSuccessResponse<T>(data: T): SetuApiSuccess<T> {
  return { ok: true, data };
}

/**
 * Wrap unknown errors safely for API responses.
 * Strips internal details — only safe summary is returned.
 */
export function handleUnknownError(
  error: unknown,
  context: string
): SetuApiError {
  // Log internal detail server-side only, never expose to client
  console.error(`[Setu] Error in ${context}:`, error instanceof Error ? error.message : "Unknown error");

  if (error instanceof SetuError) {
    return buildErrorResponse(error.code, error.clientMessage, {
      escalation_required: error.escalationRequired,
      audit_log_id: error.auditLogId,
    });
  }

  return buildErrorResponse(
    SETU_ERROR_CODES.UNKNOWN_ERROR,
    "An unexpected error occurred. Our team has been notified.",
    { escalation_required: false }
  );
}

/**
 * Typed internal error class.
 * clientMessage is safe to send to users.
 * Internal details stay server-side.
 */
export class SetuError extends Error {
  constructor(
    public readonly code: SetuErrorCode,
    public readonly clientMessage: string,
    public readonly internalDetail?: string,
    public readonly escalationRequired: boolean = false,
    public readonly auditLogId?: string
  ) {
    super(internalDetail ?? clientMessage);
    this.name = "SetuError";
  }
}

/**
 * Governance-specific error for policy violations and kill switches.
 */
export class GovernanceError extends SetuError {
  constructor(
    code: SetuErrorCode,
    clientMessage: string,
    public readonly policyKey?: string,
    auditLogId?: string
  ) {
    super(code, clientMessage, undefined, true, auditLogId);
    this.name = "GovernanceError";
  }
}

/**
 * Runtime execution is disabled — always throw this for any execution attempt.
 */
export class RuntimeDisabledError extends GovernanceError {
  constructor() {
    super(
      SETU_ERROR_CODES.RUNTIME_NOT_CONNECTED,
      "Live agent execution is not yet available. Your blueprint has been saved for review.",
      "runtime_execution_disabled"
    );
    this.name = "RuntimeDisabledError";
  }
}
