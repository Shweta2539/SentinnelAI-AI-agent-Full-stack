import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, FileSearch } from "lucide-react";
import type { Investigation } from "../../types/investigation";
import { SeverityBadge, StatusBadge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { formatRelative, truncate } from "../../utils/formatters";
import { Button } from "../ui/Button";

export function RecentInvestigationsTable({ investigations }: { investigations: Investigation[] }) {
  const navigate = useNavigate();

  if (investigations.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="No investigations yet"
        description="Upload your first log file to kick off the AI investigation pipeline."
        action={
          <Button size="sm" onClick={() => navigate("/upload")}>
            Upload a log file
          </Button>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-ink-faint">
            <th className="pb-3 font-medium">File</th>
            <th className="pb-3 font-medium">Attack type</th>
            <th className="pb-3 font-medium">Severity</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Started</th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {investigations.slice(0, 8).map((inv) => (
            <tr key={inv.id} className="group">
              <td className="py-3 pr-4 font-mono text-xs text-ink">
                {truncate(inv.filename, 28)}
              </td>
              <td className="py-3 pr-4 text-ink-muted">
                {inv.attack_type ?? "—"}
              </td>
              <td className="py-3 pr-4">
                <SeverityBadge severity={inv.severity} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={inv.status} />
              </td>
              <td className="py-3 pr-4 text-ink-faint">{formatRelative(inv.created_at)}</td>
              <td className="py-3 text-right">
                <Link
                  to={`/investigations/${inv.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-signal opacity-0 transition-opacity group-hover:opacity-100"
                >
                  View <ArrowUpRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
