// Starts the WorkOS AuthKit sign-in flow — redirects to WorkOS's hosted
// login (supports Google/Microsoft OAuth and enterprise SAML/OIDC through
// one flow). Kept separate from the existing Supabase-based /signin so the
// two auth methods don't interfere with each other; both ultimately feed
// the same ADMIN_EMAIL allowlist check in admin-guard.ts.
import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

export async function GET() {
  const signInUrl = await getSignInUrl()
  redirect(signInUrl)
}
