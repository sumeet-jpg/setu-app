// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function KillSwitchToggle({ switchId, isActive }: { switchId: string; isActive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!confirm(`Are you sure you want to ${isActive ? "deactivate" : "activate"} this kill switch?`)) return;
    setLoading(true);
    await fetch(`/api/admin/kill-switches/${switchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activate: !isActive }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
      }`}>
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
