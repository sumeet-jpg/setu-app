import { redirect } from 'next/navigation'

// This page checked Supabase Auth and bounced anyone unauthenticated to
// /signin — but Setu's actual customers are identified by an anonymous
// localStorage UUID, not a Supabase account (see src/app/my-employees).
// Nothing in the app links here (verified — orphaned route), so anyone who
// finds /dashboard by guessing the URL hit a Google/GitHub sign-in prompt
// that has no connection to their hired employees and leads nowhere. Send
// them straight to the real customer surface instead.
export default function DashboardPage() {
  redirect('/my-employees')
}
