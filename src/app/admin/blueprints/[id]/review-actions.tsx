"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BlueprintReviewActions({ blueprintId }: { blueprintId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAction(action: "approve" | "reject" | "request_changes") {
    setLoading(true);
    try {
      await fetch(`/api/admin/blueprints/${blueprintId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      setDone(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700">
        ✓ Review submitted. Page will refresh shortly.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin Review</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes for this review decision…"
        rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3"
      />
      <div className="flex gap-2">
        <button onClick={() => handleAction("approve")} disabled={loading}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
          ✓ Approve
        </button>
        <button onClick={() => handleAction("request_changes")} disabled={loading}
          className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50">
          Request Changes
        </button>
        <button onClick={() => handleAction("reject")} disabled={loading}
          className="flex-1 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50">
          Reject
        </button>
      </div>
    </div>
  );
}
