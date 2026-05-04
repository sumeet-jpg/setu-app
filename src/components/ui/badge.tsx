"use client";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "muted";
}

const variantClasses: Record<string, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  muted: "bg-gray-100 text-gray-600 border-gray-200",
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {label}
    </span>
  );
}

export function statusVariant(status: string): BadgeProps["variant"] {
  const map: Record<string, BadgeProps["variant"]> = {
    approved: "success", active: "success", completed: "success", resolved: "success", production: "success",
    pending: "warning", pending_review: "warning", draft: "warning", open: "warning", sandbox: "warning",
    rejected: "danger", blocked: "danger", failed: "danger", critical: "danger",
    reviewed: "info", pilot: "info", in_progress: "info",
    disabled: "muted", archived: "muted", closed: "muted",
  };
  return map[status] ?? "default";
}
