-- Employee hires table for Setu AI Employees marketplace
-- Stores hire requests from the /employees/[slug]/hire form

create table if not exists public.employee_hires (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Requester
  name text not null,
  email text not null,
  company text not null,
  role text,
  company_size text,

  -- Request details
  use_case text not null,
  timeline text,

  -- Which employee
  employee_slug text not null,
  employee_name text not null,
  employee_title text not null,

  -- Status workflow: pending → contacted → onboarding → active → churned
  status text not null default 'pending' check (status in ('pending', 'contacted', 'onboarding', 'active', 'churned')),

  -- Admin notes
  admin_notes text
);

-- Enable RLS
alter table public.employee_hires enable row level security;

-- Service role has full access (API routes use service role key)
create policy "service_role_full_access" on public.employee_hires
  for all to service_role using (true) with check (true);

-- No public access — all operations go through the API
create policy "anon_no_access" on public.employee_hires
  for select to anon using (false);

-- Indexes
create index idx_employee_hires_email on public.employee_hires (email);
create index idx_employee_hires_slug on public.employee_hires (employee_slug);
create index idx_employee_hires_status on public.employee_hires (status);
create index idx_employee_hires_created on public.employee_hires (created_at desc);

-- Comment
comment on table public.employee_hires is 'Hire requests submitted via the Setu AI Employees marketplace';
