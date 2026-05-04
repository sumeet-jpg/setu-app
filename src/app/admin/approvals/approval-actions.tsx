"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(true);
    await fetch(`/api/admin/approvals/${approvalId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => act("approve")} disabled={loading}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
        Approve
      </button>
      <button onClick={() => act("reject")} disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
        Reject
      </button>
    </div>
  );
}
