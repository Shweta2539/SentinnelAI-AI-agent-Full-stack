import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, FileText, PlayCircle } from "lucide-react";
import { getInvestigationHistory, startInvestigation } from "../api/investigationApi";
import { getReport } from "../api/reportApi";
import { Card, CardHeader } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { SeverityBadge, StatusBadge } from "../components/ui/Badge";
import { InvestigationStatusTimeline, type PipelineStage } from "../components/investigation/InvestigationStatusTimeline";
import { ThreatFindingsList } from "../components/investigation/ThreatFindingsList";
import { formatDate } from "../utils/formatters";
import type { Investigation, ThreatFinding } from "../types/investigation";
import type { Report } from "../types/report";

function stageFromStatus(status: string): PipelineStage {
  if (status === "completed") return "done";
  if (status === "failed") return "failed";
  if (status === "investigating") return "running";
  return "idle";
}

export function InvestigationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [threats, setThreats] = useState<ThreatFinding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const history = await getInvestigationHistory();
      const found = history.investigations.find((inv) => inv.id === id) ?? null;
      setInvestigation(found);

      if (found?.status === "completed") {
        try {
          const fetchedReport = await getReport(id);
          setReport(fetchedReport);
        } catch {
          // Report may not exist yet even if marked completed; non-fatal.
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investigation.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async () => {
    if (!id) return;
    setIsRunning(true);
    setError(null);
    try {
      const result = await startInvestigation(id);
      setInvestigation(result.investigation);
      setThreats(result.threats ?? []);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The investigation failed to run.");
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) return <Spinner label="Loading investigation" />;

  if (!investigation) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">Investigation not found.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate("/investigations")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to investigations
        </Button>
      </Card>
    );
  }

  const stage: PipelineStage = isRunning ? "running" : stageFromStatus(investigation.status);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/investigations")}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to investigations
      </button>

      <Card>
        <CardHeader
          title={investigation.filename}
          description={`Started ${formatDate(investigation.created_at)}`}
          action={
            investigation.status === "uploaded" ? (
              <Button onClick={handleRun} isLoading={isRunning} leftIcon={<PlayCircle className="h-4 w-4" />}>
                Run investigation
              </Button>
            ) : (
              <StatusBadge status={investigation.status} />
            )
          }
        />

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-faint">Attack type</p>
            <p className="mt-1 text-ink">{investigation.attack_type ?? "Not determined"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-faint">Severity</p>
            <div className="mt-1">
              <SeverityBadge severity={investigation.severity} />
            </div>
          </div>
          {report && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-faint">Report</p>
              <Link
                to={`/reports/${investigation.id}`}
                className="mt-1 inline-flex items-center gap-1 text-signal hover:text-signal-bright"
              >
                <FileText className="h-3.5 w-3.5" /> View full report
              </Link>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-alert-critical/30 bg-alert-critical/10 px-4 py-3 text-sm text-alert-critical">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {stage !== "idle" && (
        <Card>
          <CardHeader
            title="Agent pipeline"
            description="Manager → Log Parser → Threat Analyst → Knowledge Agent → Report Generator"
          />
          <InvestigationStatusTimeline stage={stage} />
        </Card>
      )}

      {threats.length > 0 && (
        <Card>
          <CardHeader title="Detected threats" description="Findings from this run" />
          <ThreatFindingsList threats={threats} />
        </Card>
      )}
    </div>
  );
}
