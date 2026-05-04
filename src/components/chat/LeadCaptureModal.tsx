// @ts-nocheck
"use client";
import { useState } from "react";

interface LeadCaptureModalProps {
  conversationId: string | null;
  blueprintId: string | null;
  onSuccess: () => void;
  onSkip: () => void;
}

export function LeadCaptureModal({ conversationId, blueprintId, onSuccess, onSkip }: LeadCaptureModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim() || undefined,
        company: company.trim() || undefined,
        conversation_id: conversationId,
        blueprint_id: blueprintId,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      setError(data.error?.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
            <span className="text-lg">📋</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">Your blueprint is ready</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave your details and a Setu advisor will review your blueprint and reach out to discuss next steps.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Work email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Your name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Company</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {loading ? "Saving…" : "Get My Blueprint Reviewed"}
          </button>
        </form>

        <button
          onClick={onSkip}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
        >
          Skip for now — continue exploring
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          No spam. A Setu advisor will reach out within 1 business day.
        </p>
      </div>
    </div>
  );
}
