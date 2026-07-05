import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "signal" | "critical" | "high" | "neutral";
  hint?: string;
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  signal: "bg-signal/10 text-signal",
  critical: "bg-alert-critical/10 text-alert-critical",
  high: "bg-alert-high/10 text-alert-high",
  neutral: "bg-base-700 text-ink-muted",
};

export function StatCard({ label, value, icon: Icon, accent = "neutral", hint }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="surface-panel p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          {label}
        </p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENT_CLASSES[accent]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </motion.div>
  );
}
