-- =============================================================
-- Migration 027: Tables that were never actually applied to production
--
-- Context: a live export request (via the new /api/manage/export route)
-- surfaced real "table not found in schema cache" errors for tables that
-- earlier audit notes had marked "confirmed applied" — that confirmation
-- was never actually checked against a live query until now. These five
-- tables are referenced by real, currently-shipping routes:
--   - employee_memories   → episodic memory (src/lib/employees/context.ts,
--                           the interview route's loadRecentContext)
--   - company_documents   → the Vault (upload/read routes, context.ts,
--                           proactive.ts) — "System 2" on the employee page
--   - employee_calibration → the Trust Ladder (calibration route) —
--                           "System 7" on the employee page
--   - action_outcomes     → outcome ratings feeding calibration
--   - employee_action_log → per-action event history (actions route)
-- Without them, these features fail closed (caught by try/catch in most
-- call sites, so they don't crash the whole request) but silently do
-- nothing — uploaded documents never actually get used, trust/autonomy
-- never actually progresses past its hardcoded default, etc.
--
-- This is the exact original SQL from migrations 005, 008, and 009 (never
-- rewritten) — just consolidated into one migration since it was never
-- actually run. `employee_action_log.action_id` references
-- `employee_actions(id)`, which already exists (migration 006's version,
-- reconciled by migration 026) — safe regardless of run order relative to
-- 026.
-- =============================================================

-- From 005_brain_architecture.sql — episodic memory
CREATE TABLE IF NOT EXISTS public.employee_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  employee_slug TEXT NOT NULL,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'message'
    CHECK (type IN ('message', 'task', 'decision', 'outcome', 'note', 'preference')),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  importance INT DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emp_mem_lookup
  ON public.employee_memories(user_id, employee_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emp_mem_session
  ON public.employee_memories(session_id);

ALTER TABLE public.employee_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "emp_mem_service_all" ON public.employee_memories;
CREATE POLICY "emp_mem_service_all" ON public.employee_memories
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "emp_mem_user_select" ON public.employee_memories;
CREATE POLICY "emp_mem_user_select" ON public.employee_memories
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- From 005_brain_architecture.sql — the Vault
CREATE TABLE IF NOT EXISTS public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  employee_slug TEXT,        -- NULL = shared with all of this user's employees
  source_type TEXT NOT NULL DEFAULT 'text'
    CHECK (source_type IN ('pdf', 'text', 'website', 'notion', 'sop', 'org_chart', 'product_catalog', 'playbook')),
  source_name TEXT NOT NULL,
  source_url TEXT,           -- GCS URI for files; canonical URL for websites
  content TEXT NOT NULL,
  chunk_index INT DEFAULT 0,
  total_chunks INT DEFAULT 1,
  word_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_docs_lookup
  ON public.company_documents(user_id, employee_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_co_docs_source
  ON public.company_documents(user_id, source_type);

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "co_docs_service_all" ON public.company_documents;
CREATE POLICY "co_docs_service_all" ON public.company_documents
  TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "co_docs_user_select" ON public.company_documents;
CREATE POLICY "co_docs_user_select" ON public.company_documents
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- From 009_calibration_engine.sql — the Trust Ladder
CREATE TABLE IF NOT EXISTS employee_calibration (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text        NOT NULL,
  employee_slug       text        NOT NULL,
  autonomy_level      float       NOT NULL DEFAULT 0.3
                                  CHECK (autonomy_level >= 0.0 AND autonomy_level <= 1.0),
  trust_score         float       NOT NULL DEFAULT 0.5
                                  CHECK (trust_score >= 0.0 AND trust_score <= 1.0),
  owner_override      float,
  total_proposals     int         NOT NULL DEFAULT 0,
  total_approved      int         NOT NULL DEFAULT 0,
  total_rejected      int         NOT NULL DEFAULT 0,
  total_done          int         NOT NULL DEFAULT 0,
  total_failed        int         NOT NULL DEFAULT 0,
  last_recalibrated   timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, employee_slug)
);

CREATE INDEX IF NOT EXISTS idx_emp_calibration_user ON employee_calibration(user_id, employee_slug);
ALTER TABLE employee_calibration ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_access" ON employee_calibration;
CREATE POLICY "owner_access" ON employee_calibration USING (true) WITH CHECK (true);

-- From 009_calibration_engine.sql — outcome ratings
CREATE TABLE IF NOT EXISTS action_outcomes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id       uuid        NOT NULL REFERENCES employee_actions(id) ON DELETE CASCADE,
  user_id         text        NOT NULL,
  employee_slug   text        NOT NULL,
  outcome_score   float       NOT NULL CHECK (outcome_score >= 0.0 AND outcome_score <= 1.0),
  note            text,
  rated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_user_slug ON action_outcomes(user_id, employee_slug);
ALTER TABLE action_outcomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_access" ON action_outcomes;
CREATE POLICY "owner_access" ON action_outcomes USING (true) WITH CHECK (true);

-- From 009_calibration_engine.sql — the recalibration function itself
CREATE OR REPLACE FUNCTION recalibrate_employee(
  p_user_id     text,
  p_slug        text
) RETURNS TABLE(autonomy_level float, trust_score float, approval_rate float) AS $$
DECLARE
  v_total      int;
  v_approved   int;
  v_rejected   int;
  v_done       int;
  v_failed     int;
  v_outcomes   float;
  v_outcome_n  int;
  v_trust      float;
  v_autonomy   float;
  v_owner_pin  float;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('approved','done')),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COUNT(*) FILTER (WHERE status = 'done'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO v_total, v_approved, v_rejected, v_done, v_failed
  FROM employee_actions
  WHERE user_id = p_user_id
    AND employee_slug = p_slug
    AND proposed_at > now() - INTERVAL '90 days';

  SELECT AVG(outcome_score), COUNT(*) INTO v_outcomes, v_outcome_n
  FROM action_outcomes
  WHERE user_id = p_user_id AND employee_slug = p_slug;

  IF v_total = 0 THEN
    v_trust := 0.5;
  ELSE
    DECLARE
      v_approval_rate float := v_approved::float / NULLIF(v_total, 0);
      v_exec_success  float := CASE WHEN v_done + v_failed > 0
                                THEN v_done::float / (v_done + v_failed)
                                ELSE 0.5 END;
    BEGIN
      v_trust := (v_approval_rate * 0.5)
               + (v_exec_success  * 0.3)
               + (COALESCE(v_outcomes, 0.5) * 0.2);
      v_trust := GREATEST(0.1, LEAST(1.0, v_trust));
    END;
  END IF;

  SELECT owner_override INTO v_owner_pin
  FROM employee_calibration
  WHERE user_id = p_user_id AND employee_slug = p_slug;

  IF v_owner_pin IS NOT NULL THEN
    v_autonomy := v_owner_pin;
  ELSE
    SELECT COALESCE(autonomy_level, 0.3) INTO v_autonomy
    FROM employee_calibration
    WHERE user_id = p_user_id AND employee_slug = p_slug;
    v_autonomy := v_autonomy + (v_trust - v_autonomy) * 0.2;
    v_autonomy := GREATEST(0.1, LEAST(0.95, v_autonomy));
  END IF;

  INSERT INTO employee_calibration (
    user_id, employee_slug, autonomy_level, trust_score,
    total_proposals, total_approved, total_rejected, total_done, total_failed,
    last_recalibrated, updated_at
  ) VALUES (
    p_user_id, p_slug, v_autonomy, v_trust,
    v_total, v_approved, v_rejected, v_done, v_failed,
    now(), now()
  )
  ON CONFLICT (user_id, employee_slug) DO UPDATE SET
    autonomy_level    = CASE WHEN employee_calibration.owner_override IS NOT NULL
                             THEN employee_calibration.owner_override
                             ELSE v_autonomy END,
    trust_score       = v_trust,
    total_proposals   = v_total,
    total_approved    = v_approved,
    total_rejected    = v_rejected,
    total_done        = v_done,
    total_failed      = v_failed,
    last_recalibrated = now(),
    updated_at        = now();

  RETURN QUERY SELECT
    v_autonomy,
    v_trust,
    CASE WHEN v_total > 0 THEN v_approved::float / v_total ELSE 0.5 END;
END;
$$ LANGUAGE plpgsql;

-- From 008_action_layer.sql — per-action event history
CREATE TABLE IF NOT EXISTS employee_action_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id   uuid        NOT NULL REFERENCES employee_actions(id) ON DELETE CASCADE,
  user_id     text        NOT NULL,
  event       text        NOT NULL CHECK (event IN ('proposed','approved','rejected','executing','done','failed')),
  note        text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_log_action ON employee_action_log(action_id);
ALTER TABLE employee_action_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_access" ON employee_action_log;
CREATE POLICY "owner_access" ON employee_action_log USING (true) WITH CHECK (true);
