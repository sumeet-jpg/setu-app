import { redirect } from "next/navigation";
import { getAdminUserOrNull } from "@/lib/governance/admin-guard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AdminSidebar userEmail={user.email} />
      <main className="flex flex-1 flex-col overflow-auto">
        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
