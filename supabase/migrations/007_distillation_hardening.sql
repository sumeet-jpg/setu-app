-- ─────────────────────────────────────────────────────────────────────────────
-- 007_distillation_hardening.sql
-- S1 Distillation Engine — hardening pass
-- S2 CKG — Ebbinghaus decay + skill memory category
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add skill_learned category to employee_beliefs ─────────────────────────
-- Drop old check constraint, recreate with skill_learned included.

alter table public.employee_beliefs
  drop constraint if exists employee_beliefs_category_check;

alter table public.employee_beliefs
  add constraint employee_beliefs_category_check check (category in (
    'owner_preference', 'business_context', 'decision', 'relationship',
    'market_signal', 'failure_pattern', 'success_pattern', 'domain_update',
    'skill_learned'
  ));

-- ── increment_belief_reinforcement RPC ─────────────────────────────────────
-- Called by distill/route.ts when an existing belief is reinforced.
-- Increments counter + refreshes last_validated_at.

create or replace function public.increment_belief_reinforcement(belief_id uuid)
returns void
language sql
security definer
as $$
  update public.employee_beliefs
  set
    reinforcement_count = reinforcement_count + 1,
    last_validated_at   = now(),
    updated_at          = now()
  where id = belief_id;
$$;

-- ── apply_belief_decay ──────────────────────────────────────────────────────
-- Ebbinghaus decay: confidence decays by decay_rate per week without reinforcement.
-- Safe to call weekly via Supabase pg_cron or an API cron endpoint.
-- Only decays beliefs that haven't been validated in > 7 days.
-- Never decays below 0.1 so beliefs don't silently vanish — they stay queryable.

create or replace function public.apply_belief_decay(p_user_id uuid default null)
returns table(decayed_count int, zeroed_count int)
language plpgsql
security definer
as $$
declare
  v_decayed int := 0;
  v_zeroed  int := 0;
begin
  update public.employee_beliefs
  set
    confidence  = greatest(0.1, confidence - decay_rate),
    updated_at  = now()
  where
    last_validated_at < now() - interval '7 days'
    and confidence > 0.1
    and (p_user_id is null or user_id = p_user_id);

  get diagnostics v_decayed = row_count;

  -- Count how many hit the floor (0.1) — useful for monitoring
  select count(*) into v_zeroed
  from public.employee_beliefs
  where confidence <= 0.1
    and (p_user_id is null or user_id = p_user_id);

  return query select v_decayed, v_zeroed;
end;
$$;

-- ── beliefs_with_age view ───────────────────────────────────────────────────
-- Convenience view: adds days_since_validated so the owner UI can show staleness.

create or replace view public.employee_beliefs_enriched as
select
  b.*,
  extract(epoch from (now() - b.last_validated_at)) / 86400 as days_since_validated,
  case
    when b.last_validated_at > now() - interval '7 days'  then 'fresh'
    when b.last_validated_at > now() - interval '30 days' then 'aging'
    else 'stale'
  end as freshness
from public.employee_beliefs b;

-- RLS on the view: inherit from base table via security_invoker
alter view public.employee_beliefs_enriched set (security_invoker = true);

-- ── Distillation runs: add failure_count for monitoring ────────────────────
alter table public.distillation_runs
  add column if not exists skill_beliefs_extracted int not null default 0;
