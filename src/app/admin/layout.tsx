// @ts-nocheck
import { redirect } from "next/navigation";
import { getAdminUserOrNull } from "@/lib/governance/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getExecuteEngineStats } from "@/lib/services/admin.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Console",
    template: "%s | Setu Admin",
  },
};

/**
 * Admin layout — server-side auth gate.
 * All /admin/* routes are protected here.
 * If no authenticated user, redirect to login.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUserOrNull();

  if (!user) {
    redirect("/auth/login?redirect=/admin");
  }

  // Best-effort — the sidebar's "Runtime" badge used to hardcode "Disabled"
  // on every admin page regardless of what's actually running. See
  // /admin/runtime for the full picture (two separate execution systems).
  let pendingApprovals = 0;
  try {
    pendingApprovals = (await getExecuteEngineStats()).pendingApprovals;
  } catch {
    // leave at 0 rather than block the whole admin console on this
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AdminSidebar userEmail={user.email} pendingApprovals={pendingApprovals} />
      <main className="flex flex-1 flex-col overflow-auto">
        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
