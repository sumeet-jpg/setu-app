-- =============================================================
-- SETU — Migration 019: task_approvals.tool_use_id
--
-- Context: the execute loop (src/app/api/employees/[slug]/execute/route.ts)
-- pauses on request_approval by sending the Claude tool_use_id to the
-- client in an SSE event, but never persisted it anywhere server-side.
-- When the user approved, the client resent the ORIGINAL task text as a
-- brand-new message with no task history and no reference to which
-- tool_use_id was being answered — Claude had no way to actually resume;
-- it just started a fresh conversation and, most of the time, asked for
-- approval again on the same step. Every task requiring approval (i.e.
-- every consequential real action, per the system prompt) was stuck in
-- that loop or silently diverged from what was actually approved.
--
-- This column lets the resumed request find the correct pending approval
-- row and match it to the correct Anthropic tool_result — see the
-- accompanying code fix in execute/route.ts.
-- =============================================================

ALTER TABLE public.task_approvals
  ADD COLUMN IF NOT EXISTS tool_use_id text;

CREATE INDEX IF NOT EXISTS idx_task_approvals_tool_use_id
  ON public.task_approvals (task_id, tool_use_id);
