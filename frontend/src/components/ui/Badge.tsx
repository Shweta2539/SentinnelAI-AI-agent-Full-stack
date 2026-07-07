
import { severityStyles } from "../../utils/formatters";

export function SeverityBadge({ severity }: { severity: string | null | undefined }) {
  const styles = severityStyles(severity);
  const label = (severity || "none").toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ${styles.bg} ${styles.text} ${styles.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  uploaded: "bg-base-700 text-ink-muted ring-border-light",
  investigating: "bg-signal/10 text-signal ring-signal/30",
  completed: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  failed: "bg-alert-critical/10 text-alert-critical ring-alert-critical/30",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = STATUS_STYLES[status] ?? STATUS_STYLES.uploaded;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide ring-1 ${classes}`}
    >
      {status}
    </span>
  );
}
