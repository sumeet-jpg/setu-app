-- =============================================================
-- SETU — Migration 011: Fix anonymous user_id FK constraints
-- Context: Setu uses anonymous localStorage UUIDs, not auth.users.
-- Migrations 004 incorrectly added REFERENCES auth.users(id) on
-- tool_connections and employee_tasks, blocking all task execution.
-- This migration is safe to run whether 004 was applied or not.
-- =============================================================

-- Create task_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'planning','awaiting_approval','executing','paused','complete','failed','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create approval_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── tool_connections ─────────────────────────────────────────────────────────
-- Create without FK if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.tool_connections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,   -- anonymous UUID, no FK to auth.users
  tool_slug     TEXT        NOT NULL,
  encrypted_key TEXT        NOT NULL,
  config        JSONB       NOT NULL DEFAULT '{}',
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ,
  UNIQUE (user_id, tool_slug)
);

-- If table existed with UUID type + FK, drop the FK constraint
ALTER TABLE public.tool_connections
  DROP CONSTRAINT IF EXISTS tool_connections_user_id_fkey;

ALTER TABLE public.tool_connections
  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "service_role_full_access" ON public.tool_connections
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_tool_connections_user ON public.tool_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_tool_connections_slug ON public.tool_connections (user_id, tool_slug);

-- ── employee_tasks ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL,   -- anonymous UUID, no FK to auth.users
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

ALTER TABLE public.employee_tasks
  DROP CONSTRAINT IF EXISTS employee_tasks_user_id_fkey;

ALTER TABLE public.employee_tasks
  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "service_role_full_access" ON public.employee_tasks
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_employee_tasks_user    ON public.employee_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_slug    ON public.employee_tasks (user_id, employee_slug);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_status  ON public.employee_tasks (status);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_created ON public.employee_tasks (created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employee_tasks_updated_at ON public.employee_tasks;
CREATE TRIGGER employee_tasks_updated_at
  BEFORE UPDATE ON public.employee_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── task_approvals ────────────────────────────────────────────────────────────
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

DO $$ BEGIN
  CREATE POLICY "service_role_full_access" ON public.task_approvals
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_task_approvals_task   ON public.task_approvals (task_id);
CREATE INDEX IF NOT EXISTS idx_task_approvals_status ON public.task_approvals (task_id, status);

COMMENT ON COLUMN public.tool_connections.user_id IS 'Anonymous UUID from localStorage (not auth.users)';
COMMENT ON COLUMN public.employee_tasks.user_id    IS 'Anonymous UUID from localStorage (not auth.users)';
