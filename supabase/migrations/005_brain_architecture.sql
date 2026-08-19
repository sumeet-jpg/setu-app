-- Brain Architecture: 3 memory layers per AI employee
-- Layer 2: Episodic Memory — every conversation, task, decision, outcome
-- Layer 3: Company Intelligence — documents, website, SOPs (GCS for files, this table for chunks/metadata)
-- Layer 4: Relationship Memory — customers, leads, partners, stakeholders

-- ────────────────────────────────────────────────────────────────────────────
-- Layer 2: Episodic Memory
-- ────────────────────────────────────────────────────────────────────────────
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

-- Service role can do everything (internal agents, admin)
CREATE POLICY "emp_mem_service_all" ON public.employee_memories
  TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read their own
CREATE POLICY "emp_mem_user_select" ON public.employee_memories
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Layer 3: Company Intelligence
-- Each row = one chunk from a user's document/website/SOP
-- Files themselves stored in GCS; only extracted text chunks live here
-- ────────────────────────────────────────────────────────────────────────────
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

CREATE POLICY "co_docs_service_all" ON public.company_documents
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "co_docs_user_select" ON public.company_documents
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Layer 4: Relationship Memory
-- People the employee encounters — customers, leads, partners, stakeholders
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.relationship_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  employee_slug TEXT,        -- NULL = visible to all of this user's employees
  contact_type TEXT NOT NULL DEFAULT 'customer'
    CHECK (contact_type IN ('customer', 'lead', 'partner', 'stakeholder', 'vendor', 'investor', 'team_member')),
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  email TEXT,
  notes TEXT,
  last_interaction TIMESTAMPTZ,
  interaction_count INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rel_mem_lookup
  ON public.relationship_memory(user_id, contact_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rel_mem_name
  ON public.relationship_memory(user_id, name);

ALTER TABLE public.relationship_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rel_mem_service_all" ON public.relationship_memory
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "rel_mem_user_select" ON public.relationship_memory
  FOR SELECT TO authenticated USING (auth.uid()::text = user_id);

-- Auto-update updated_at on relationship_memory
CREATE OR REPLACE FUNCTION update_rel_mem_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_rel_mem_updated_at ON public.relationship_memory;
CREATE TRIGGER trg_rel_mem_updated_at
  BEFORE UPDATE ON public.relationship_memory
  FOR EACH ROW EXECUTE FUNCTION update_rel_mem_updated_at();
