"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function BlueprintReviewForm({ blueprintId }: { blueprintId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: "approve" | "reject" | "request_changes") {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/blueprints/${blueprintId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error?.message ?? "Failed"); setLoading(false); return; }
    router.push("/admin/blueprints");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Admin notes (optional)…"
        rows={3}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => submit("approve")} disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          Approve
        </button>
        <button onClick={() => submit("request_changes")} disabled={loading}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
          Request Changes
        </button>
        <button onClick={() => submit("reject")} disabled={loading}
          className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">
          Reject
        </button>
      </div>
    </div>
  );
}
