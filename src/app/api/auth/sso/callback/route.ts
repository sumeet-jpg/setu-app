// WorkOS AuthKit callback — exchanges the authorization code for a session
// and sets the encrypted session cookie. Must match NEXT_PUBLIC_WORKOS_REDIRECT_URI
// exactly, and that same URL must be registered in the WorkOS dashboard as an
// allowed redirect URI (Configuration → Redirects).
import { handleAuth } from '@workos-inc/authkit-nextjs'

export const GET = handleAuth({ returnPathname: '/admin' })
