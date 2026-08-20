-- ─────────────────────────────────────────────────────────────────────────────
-- S6 ACT — Action Layer
-- Employees propose discrete, owner-approved actions during sessions.
-- Actions never execute without owner approval (status: pending → approved).
-- ─────────────────────────────────────────────────────────────────────────────

-- Action proposals from employees
CREATE TABLE IF NOT EXISTS employee_actions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          text        NOT NULL,
  employee_slug    text        NOT NULL,
  session_id       text,
  action_type      text        NOT NULL,
  title            text        NOT NULL,
  description      text        NOT NULL,
  payload          jsonb       DEFAULT '{}'::jsonb,
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected','executing','done','failed')),
  proposed_at      timestamptz DEFAULT now(),
  approved_at      timestamptz,
  rejected_at      timestamptz,
  rejection_reason text,
  executed_at      timestamptz,
  result           jsonb,
  error            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emp_actions_user_slug  ON employee_actions(user_id, employee_slug);
CREATE INDEX IF NOT EXISTS idx_emp_actions_status     ON employee_actions(status);
CREATE INDEX IF NOT EXISTS idx_emp_actions_session    ON employee_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_emp_actions_proposed   ON employee_actions(proposed_at DESC);

-- RLS
ALTER TABLE employee_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_access" ON employee_actions USING (true) WITH CHECK (true);

-- Action execution log (immutable append-only record of what actually happened)
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
CREATE POLICY "owner_access" ON employee_action_log USING (true) WITH CHECK (true);
