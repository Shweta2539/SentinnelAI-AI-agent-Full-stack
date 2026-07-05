import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowUpRight } from "lucide-react";
import { getInvestigationHistory } from "../api/investigationApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { SeverityBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatDate, truncate } from "../utils/formatters";
import type { Investigation } from "../types/investigation";

export function ReportsPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    getInvestigationHistory()
      .then((data) => isMounted && setInvestigations(data.investigations))
      .catch((err) => isMounted && setError(err instanceof Error ? err.message : "Failed to load."))
      .finally(() => isMounted && setIsLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) return <Spinner label="Loading reports" />;

  if (error) {
    return (
      <div className="rounded-lg border border-alert-critical/30 bg-alert-critical/10 px-4 py-3 text-sm text-alert-critical">
        {error}
      </div>
    );
  }

  const completed = investigations.filter((inv) => inv.status === "completed");

  if (completed.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No reports yet"
        description="Reports appear here once an investigation finishes running."
        action={<Button onClick={() => navigate("/upload")}>Start an investigation</Button>}
      />
    );
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-ink-faint">
            <th className="px-6 py-4 font-medium">File</th>
            <th className="px-4 py-4 font-medium">Attack type</th>
            <th className="px-4 py-4 font-medium">Severity</th>
            <th className="px-4 py-4 font-medium">Generated</th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {completed.map((inv) => (
            <tr key={inv.id} className="group hover:bg-base-800/40">
              <td className="px-6 py-4 font-mono text-xs text-ink">
                {truncate(inv.filename, 32)}
              </td>
              <td className="px-4 py-4 text-ink-muted">{inv.attack_type ?? "—"}</td>
              <td className="px-4 py-4">
                <SeverityBadge severity={inv.severity} />
              </td>
              <td className="px-4 py-4 text-ink-faint">{formatDate(inv.created_at)}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => navigate(`/reports/${inv.id}`)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-signal opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Open <ArrowUpRight className="h-3 w-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
