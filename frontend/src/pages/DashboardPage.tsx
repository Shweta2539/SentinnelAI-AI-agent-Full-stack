import { useEffect, useState } from "react";
import { AlertTriangle, FileClock, ShieldCheck, ShieldQuestion } from "lucide-react";
import { getInvestigationHistory } from "../api/investigationApi";
import { Card, CardHeader } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { StatCard } from "../components/dashboard/StatCard";
import { SeverityChart } from "../components/dashboard/SeverityChart";
import { RecentInvestigationsTable } from "../components/dashboard/RecentInvestigationsTable";
import type { Investigation } from "../types/investigation";

export function DashboardPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getInvestigationHistory()
      .then((data) => {
        if (isMounted) setInvestigations(data.investigations);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load data.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Spinner label="Loading dashboard" />;
  }

  const activeCount = investigations.filter((i) => i.status === "investigating").length;
  const completedCount = investigations.filter((i) => i.status === "completed").length;
  const criticalCount = investigations.filter(
    (i) => (i.severity || "").toLowerCase() === "critical"
  ).length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-alert-critical/30 bg-alert-critical/10 px-4 py-3 text-sm text-alert-critical">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total investigations"
          value={investigations.length}
          icon={ShieldQuestion}
          accent="neutral"
        />
        <StatCard
          label="In progress"
          value={activeCount}
          icon={FileClock}
          accent="signal"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={ShieldCheck}
          accent="signal"
        />
        <StatCard
          label="Critical severity"
          value={criticalCount}
          icon={AlertTriangle}
          accent="critical"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Severity breakdown"
            description="Across all investigations to date"
          />
          <SeverityChart investigations={investigations} />
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent investigations"
            description="Your latest uploaded logs and their status"
          />
          <RecentInvestigationsTable investigations={investigations} />
        </Card>
      </div>
    </div>
  );
}
