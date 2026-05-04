export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    pending_review: "bg-purple-100 text-purple-700",
    reviewed: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    archived: "bg-gray-100 text-gray-500",
    new: "bg-blue-100 text-blue-700",
    qualified: "bg-emerald-100 text-emerald-700",
    unqualified: "bg-gray-100 text-gray-500",
    converted: "bg-emerald-100 text-emerald-700",
    lost: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    active: "bg-emerald-100 text-emerald-700",
    disabled: "bg-gray-100 text-gray-500",
    open: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
    escalated: "bg-red-100 text-red-700",
    resolved: "bg-emerald-100 text-emerald-700",
    closed: "bg-gray-100 text-gray-500",
    queued: "bg-gray-100 text-gray-600",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    tier_1_pilot_ready: "bg-emerald-100 text-emerald-700",
    tier_2_packaged_offer: "bg-blue-100 text-blue-700",
    tier_3_catalog_offer: "bg-gray-100 text-gray-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
