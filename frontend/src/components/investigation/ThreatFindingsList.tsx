import { ShieldAlert } from "lucide-react";
import type { ThreatFinding } from "../../types/investigation";
import { SeverityBadge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";

export function ThreatFindingsList({ threats }: { threats: ThreatFinding[] }) {
  if (threats.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No threats detected"
        description="The Threat Analyst agent did not flag any known attack patterns in this log."
      />
    );
  }

  return (
    <div className="space-y-3">
      {threats.map((threat, idx) => (
        <div
          key={`${threat.threat_type}-${idx}`}
          className="rounded-xl border border-border-light bg-base-800/50 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-semibold text-ink">
              {threat.threat_type}
            </p>
            <SeverityBadge severity={threat.severity} />
          </div>

          {threat.description && (
            <p className="mt-2 text-sm text-ink-muted">{threat.description}</p>
          )}

          {threat.confidence && (
            <p className="mt-2 text-xs text-ink-faint">
              Confidence: <span className="text-ink-muted">{threat.confidence}</span>
            </p>
          )}

          {threat.evidence && threat.evidence.length > 0 && (
            <div className="mt-3 space-y-1 rounded-lg bg-base-950/60 p-3 font-mono text-xs text-ink-muted">
              {threat.evidence.slice(0, 5).map((line, lineIdx) => (
                <p key={lineIdx} className="truncate">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
