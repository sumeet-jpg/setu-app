-- =============================================================
-- Migration 025: Customer-supplied AI provider keys (BYOK)
--
-- Context: today, every real task execution (post-hire, real tool actions)
-- runs on Setu's own ANTHROPIC_API_KEY, capped per customer at
-- HIRED_EMPLOYEE_MONTHLY_CAP_USD (src/lib/usage/cap.ts) to keep the
-- founder from bearing unbounded inference cost. The founder wants
-- customers to be able to connect their own AI provider key once hired —
-- their inference, their cost, uncapped. Anthropic only for now: the
-- execute loop's tool-use protocol (request_approval/http_request/
-- task_complete, its streaming format) is written specifically against
-- Anthropic's Messages API — a customer bringing an OpenAI key would need
-- a parallel tool-calling implementation, a distinct, larger piece of work
-- not started here.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.customer_ai_keys (
  user_id       text        NOT NULL,
  provider      text        NOT NULL CHECK (provider IN ('anthropic')),
  encrypted_key text        NOT NULL,
  key_version   int         NOT NULL DEFAULT 1,
  model         text,
  connected_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz,
  PRIMARY KEY (user_id, provider)
);

ALTER TABLE public.customer_ai_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON public.customer_ai_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);
