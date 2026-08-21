import { redirect } from 'next/navigation'

// This used to render a full, unauthenticated copy of the admin blueprint
// review console (risk scores, cost estimates, approve/reject) — anyone
// could browse every prospect's blueprint at /blueprints and /blueprints/[id]
// with zero auth. The real admin-only version lives at /admin/blueprints,
// gated by src/app/admin/layout.tsx. The only legitimate public entry point
// here is starting a new blueprint, so send visitors straight there.
export default function BlueprintsPage() {
  redirect('/blueprints/new')
}
