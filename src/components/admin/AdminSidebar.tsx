// @ts-nocheck
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AdminSidebarProps {
  userEmail: string;
}

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: "⬛",
  },
  {
    label: "Blueprints",
    href: "/admin/blueprints",
    icon: "📋",
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: "👤",
  },
  {
    label: "Employee Hires",
    href: "/admin/hires",
    icon: "🤝",
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: "💳",
  },
  {
    label: "Agent Catalog",
    href: "/admin/agents",
    icon: "🤖",
  },
  {
    label: "Approvals",
    href: "/admin/approvals",
    icon: "✅",
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: "📒",
  },
  {
    label: "Policy",
    href: "/admin/policy",
    icon: "🛡️",
  },
  {
    label: "Runtime",
    href: "/admin/runtime",
    icon: "⚙️",
  },
  {
    label: "Support",
    href: "/admin/support",
    icon: "💬",
  },
  {
    label: "Internal Agents",
    href: "/admin/internal-agents",
    icon: "🧠",
  },
];

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="flex w-56 flex-col border-r border-border bg-card lg:w-64">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">S</span>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Setu</p>
          <p className="text-xs text-muted-foreground">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Runtime status indicator */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Runtime: Disabled
        </div>
      </div>

      {/* User */}
      <div className="border-t border-border px-4 py-4">
        <div className="mb-2">
          <p className="truncate text-xs font-medium text-foreground">
            {userEmail}
          </p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
