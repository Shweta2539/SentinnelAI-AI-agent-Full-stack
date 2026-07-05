import type { Severity } from "../types/investigation";

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string): string {
  const date = new Date(iso).getTime();
  const diffMs = Date.now() - date;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

const SEVERITY_STYLES: Record<
  string,
  { text: string; bg: string; ring: string; dot: string }
> = {
  critical: {
    text: "text-alert-critical",
    bg: "bg-alert-critical/10",
    ring: "ring-alert-critical/30",
    dot: "bg-alert-critical",
  },
  high: {
    text: "text-alert-high",
    bg: "bg-alert-high/10",
    ring: "ring-alert-high/30",
    dot: "bg-alert-high",
  },
  medium: {
    text: "text-alert-medium",
    bg: "bg-alert-medium/10",
    ring: "ring-alert-medium/30",
    dot: "bg-alert-medium",
  },
  low: {
    text: "text-alert-low",
    bg: "bg-alert-low/10",
    ring: "ring-alert-low/30",
    dot: "bg-alert-low",
  },
  none: {
    text: "text-ink-muted",
    bg: "bg-alert-none/10",
    ring: "ring-alert-none/30",
    dot: "bg-alert-none",
  },
};

export function severityStyles(severity: string | null | undefined) {
  const key = (severity || "none").toLowerCase();
  return SEVERITY_STYLES[key] ?? SEVERITY_STYLES.none;
}

export function normalizeSeverity(severity: string | null | undefined): Severity {
  const key = (severity || "none").toLowerCase();
  if (key === "critical" || key === "high" || key === "medium" || key === "low") {
    return key;
  }
  return "none";
}

const STATUS_LABELS: Record<string, string> = {
  uploaded: "Uploaded",
  investigating: "Investigating",
  completed: "Completed",
  failed: "Failed",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}\u2026`;
}
