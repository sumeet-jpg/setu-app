// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function InternalAgentRunner({ agentKey, agentName, inputSchema }: { agentKey: string; agentName: string; inputSchema: Record<string, string> }) {
  const router = useRouter();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true); setResult(null); setError(null);
    const res = await fetch(`/api/admin/internal-agents/${agentKey}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_data: inputs }),
    });
    const data = await res.json();
    if (!data.ok) { setError(data.error?.message ?? "Failed"); }
    else { setResult(JSON.stringify(data.data.output ?? data.data, null, 2)); }
    setLoading(false);
    router.refresh();
  }

  const fields = Object.entries(inputSchema ?? {});

  return (
    <div className="space-y-2">
      {fields.slice(0, 3).map(([key, type]) => (
        <input key={key} placeholder={`${key} (${type})`}
          value={inputs[key] ?? ""}
          onChange={e => setInputs(prev => ({ ...prev, [key]: e.target.value }))}
          className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
      ))}
      <button onClick={run} disabled={loading}
        className="w-full rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {loading ? "Running…" : `Run ${agentName}`}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {result && <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-40">{result}</pre>}
    </div>
  );
}
