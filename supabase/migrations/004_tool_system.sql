-- =============================================================
-- SETU — Migration 004: Tool Execution System
-- Run: supabase db push  OR  paste into Supabase SQL Editor
-- =============================================================

-- ── Task status enum ─────────────────────────────────────────
CREATE TYPE task_status AS ENUM (
  'planning',
  'awaiting_approval',
  'executing',
  'paused',
  'complete',
  'failed',
  'cancelled'
);

-- ── Tool connections (encrypted API keys per user per tool) ──
CREATE TABLE IF NOT EXISTS public.tool_connections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug     TEXT        NOT NULL,
  encrypted_key TEXT        NOT NULL,
  config        JSONB       NOT NULL DEFAULT '{}',
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ,
  UNIQUE (user_id, tool_slug)
);

ALTER TABLE public.tool_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.tool_connections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_own_connections" ON public.tool_connections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_tool_connections_user ON public.tool_connections (user_id);
CREATE INDEX idx_tool_connections_slug ON public.tool_connections (user_id, tool_slug);

-- ── Employee tasks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_slug TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  status        task_status NOT NULL DEFAULT 'planning',
  messages      JSONB       NOT NULL DEFAULT '[]',
  tool_calls    JSONB       NOT NULL DEFAULT '[]',
  results       JSONB       NOT NULL DEFAULT '{}',
  context       JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employee_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.employee_tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_own_tasks" ON public.employee_tasks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_employee_tasks_user    ON public.employee_tasks (user_id);
CREATE INDEX idx_employee_tasks_slug    ON public.employee_tasks (user_id, employee_slug);
CREATE INDEX idx_employee_tasks_status  ON public.employee_tasks (status);
CREATE INDEX idx_employee_tasks_created ON public.employee_tasks (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_tasks_updated_at
  BEFORE UPDATE ON public.employee_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Task approvals ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_approvals (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID            NOT NULL REFERENCES public.employee_tasks(id) ON DELETE CASCADE,
  sequence    INT             NOT NULL DEFAULT 0,
  action      TEXT            NOT NULL,
  preview     JSONB           NOT NULL DEFAULT '{}',
  status      approval_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  decided_at  TIMESTAMPTZ
);

ALTER TABLE public.task_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON public.task_approvals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_own_approvals" ON public.task_approvals
  FOR ALL TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM public.employee_tasks WHERE id = task_id)
  );

CREATE INDEX idx_task_approvals_task   ON public.task_approvals (task_id);
CREATE INDEX idx_task_approvals_status ON public.task_approvals (task_id, status);

COMMENT ON TABLE public.tool_connections IS 'Encrypted API keys for tools connected by each user';
COMMENT ON TABLE public.employee_tasks   IS 'Tasks delegated to AI employees with full execution log';
COMMENT ON TABLE public.task_approvals   IS 'Approval gates for destructive/expensive actions';
