import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { getInvestigationHistory } from "../api/investigationApi";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { SeverityBadge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatDate, truncate } from "../utils/formatters";
import type { Investigation } from "../types/investigation";
import { useNavigate } from "react-router-dom";

export function InvestigationsPage() {
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

  if (isLoading) return <Spinner label="Loading investigations" />;

  if (error) {
    return (
      <div className="rounded-lg border border-alert-critical/30 bg-alert-critical/10 px-4 py-3 text-sm text-alert-critical">
        {error}
      </div>
    );
  }

  if (investigations.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No investigations yet"
        description="Upload a log file to see it show up here with its status and findings."
        action={<Button onClick={() => navigate("/upload")}>Upload a log file</Button>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {investigations.map((inv) => (
        <Card key={inv.id} className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-mono text-xs text-ink" title={inv.filename}>
              {truncate(inv.filename, 30)}
            </p>
            <StatusBadge status={inv.status} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-muted">
              {inv.attack_type ?? "Attack type pending"}
            </p>
            <SeverityBadge severity={inv.severity} />
          </div>

          <p className="text-xs text-ink-faint">{formatDate(inv.created_at)}</p>

          <Link
            to={`/investigations/${inv.id}`}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-signal hover:text-signal-bright"
          >
            View investigation <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Card>
      ))}
    </div>
  );
}
