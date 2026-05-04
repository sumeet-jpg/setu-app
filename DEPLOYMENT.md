# Setu App — Deployment Guide

## Prerequisites
- Node.js 20+
- npm
- Supabase account + project (`vemwpoioaizueooqithg`)
- Vercel account
- OpenAI API key
- Anthropic API key
- Resend account

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env.local

# 3. Fill in .env.local with real values from SETU_BUILD_ENV_NOTES.txt
# CRITICAL: Never commit .env.local

# 4. Run development server
npm run dev

# App runs at: http://localhost:3000
# Admin console: http://localhost:3000/admin
# Blueprint builder: http://localhost:3000/blueprints/new
```

---

## Supabase Setup (run in order)

### 1. Run migrations in Supabase SQL Editor

Open https://supabase.com/dashboard/project/vemwpoioaizueooqithg/sql

Run each file in order:
1. `supabase/migrations/001_core_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

### 2. Run seed data

Run each file in order:
3. `supabase/seed/01_tool_categories.sql`
4. `supabase/seed/02_policy_templates.sql`
5. `supabase/seed/03_agents_100_launch_catalog.sql`
6. `supabase/seed/04_internal_agents.sql`
7. `supabase/seed/05_knowledge_articles.sql`

### 3. Create admin user

Authentication → Users → Add user:
- Email: `Sumeet@setuagents.com`
- Password: your chosen admin password
- Auto-confirm: Yes

### 4. Configure Auth settings

Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs: add `http://localhost:3000/auth/callback`

### 5. Create Storage buckets

Storage → New bucket (repeat for each):
- `blueprints` (private)
- `uploads` (private)
- `sandbox-files` (private)

### 6. Generate TypeScript types

```bash
npm run db:generate
```

---

## Vercel Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Link project
```bash
vercel link
```

### 3. Add environment variables in Vercel Dashboard

Project Settings → Environment Variables — add ALL variables from `.env.example`.

CRITICAL: Mark these as server-only (do NOT add NEXT_PUBLIC_ prefix):
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `APP_SECRET`
- `ENCRYPTION_KEY`
- `WEBHOOK_SIGNING_SECRET`

### 4. Deploy
```bash
vercel --prod
```

### 5. Update Supabase Auth for production

Authentication → URL Configuration:
- Site URL: `https://app.setuagents.com`
- Add redirect URL: `https://app.setuagents.com/auth/callback`

### 6. Update NEXT_PUBLIC_APP_URL in Vercel
Set `NEXT_PUBLIC_APP_URL=https://app.setuagents.com`

---

## Runtime Status

⚠️ Runtime execution is **disabled** until enterprise n8n is activated.

The app is fully functional for:
- Blueprint generation
- Agent catalog browsing
- Lead capture
- Admin console

Live agent execution requires:
1. n8n Enterprise plan activation
2. Setting `RUNTIME_EXECUTION_ENABLED=true`
3. Removing the global kill switch from the `kill_switches` table
4. Configuring a `runtime_instances` record

---

## Phase Build Status

- [x] Phase 1 — Foundation (schema, auth, env, types, governance)
- [x] Phase 2 — Blueprint Engine + Conversation API
- [ ] Phase 3 — Admin Console (live data wired)
- [ ] Phase 4 — Internal Agents
- [ ] Phase 5 — Agent Catalog Public Pages
- [ ] Phase 6 — Security Hardening
