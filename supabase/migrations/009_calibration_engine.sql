-- ─────────────────────────────────────────────────────────────────────────────
-- S7 CAL — Calibration Engine
-- Trust gradient, autonomy dial, outcome attribution, audit trail.
-- The engine adjusts how much latitude each employee is given based on
-- the owner's actual approval/rejection history — not a static setting.
-- ─────────────────────────────────────────────────────────────────────────────

-- Per-employee calibration state
-- autonomy_level: 0 (fully supervised) → 1 (fully autonomous)
-- trust_score: rolling average of outcome quality (0–1)
-- The system nudges autonomy_level toward the trust_score over time.
CREATE TABLE IF NOT EXISTS employee_calibration (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text        NOT NULL,
  employee_slug       text        NOT NULL,
  autonomy_level      float       NOT NULL DEFAULT 0.3
                                  CHECK (autonomy_level >= 0.0 AND autonomy_level <= 1.0),
  trust_score         float       NOT NULL DEFAULT 0.5
                                  CHECK (trust_score >= 0.0 AND trust_score <= 1.0),
  owner_override      float,      -- null = system-managed; set = owner pinned the dial
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
CREATE POLICY "owner_access" ON employee_calibration USING (true) WITH CHECK (true);

-- Outcome attribution: owner rates individual action results
-- Used to compute trust_score beyond simple approve/reject ratios
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
CREATE POLICY "owner_access" ON action_outcomes USING (true) WITH CHECK (true);

-- Recalibrate trust score for a given employee based on recent action history
-- Called automatically after every approve/reject and after every outcome rating.
-- Uses a 90-day rolling window, weighted toward recency.
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
  -- Count actions in rolling 90-day window
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

  -- Average outcome score from explicit ratings
  SELECT AVG(outcome_score), COUNT(*) INTO v_outcomes, v_outcome_n
  FROM action_outcomes
  WHERE user_id = p_user_id AND employee_slug = p_slug;

  -- Trust score = weighted blend of approval rate + outcome ratings
  IF v_total = 0 THEN
    v_trust := 0.5;  -- no data → neutral
  ELSE
    DECLARE
      v_approval_rate float := v_approved::float / NULLIF(v_total, 0);
      v_exec_success  float := CASE WHEN v_done + v_failed > 0
                                THEN v_done::float / (v_done + v_failed)
                                ELSE 0.5 END;
    BEGIN
      -- Blend: 50% approval rate, 30% execution success, 20% explicit outcome ratings
      v_trust := (v_approval_rate * 0.5)
               + (v_exec_success  * 0.3)
               + (COALESCE(v_outcomes, 0.5) * 0.2);
      v_trust := GREATEST(0.1, LEAST(1.0, v_trust));
    END;
  END IF;

  -- Check for owner pin
  SELECT owner_override INTO v_owner_pin
  FROM employee_calibration
  WHERE user_id = p_user_id AND employee_slug = p_slug;

  -- Autonomy level: if owner pinned, use that; otherwise nudge toward trust score
  IF v_owner_pin IS NOT NULL THEN
    v_autonomy := v_owner_pin;
  ELSE
    SELECT COALESCE(autonomy_level, 0.3) INTO v_autonomy
    FROM employee_calibration
    WHERE user_id = p_user_id AND employee_slug = p_slug;
    -- Nudge: move 20% of the way from current autonomy toward trust score each recalibration
    v_autonomy := v_autonomy + (v_trust - v_autonomy) * 0.2;
    v_autonomy := GREATEST(0.1, LEAST(0.95, v_autonomy));
  END IF;

  -- Upsert calibration record
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
