// Runs before every test file. Several modules validate NEXT_PUBLIC_* env
// vars at import time (src/lib/env.ts's top-level `clientEnv`), which throws
// for any test that transitively imports @/lib/supabase/server — even tests
// that never touch Supabase at runtime, like context.test.ts's pure
// extractKeywords. These are fake values, never real ones: only present so
// module-load-time validation doesn't crash the whole suite.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
