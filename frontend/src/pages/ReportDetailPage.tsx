import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { getInvestigationHistory } from "../api/investigationApi";
import { getReport } from "../api/reportApi";
import { Card, CardHeader } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { SeverityBadge } from "../components/ui/Badge";
import { RecommendationsList } from "../components/reports/RecommendationsList";
import { generateReportPdf } from "../utils/pdfGenerator";
import { formatDate } from "../utils/formatters";
import type { Investigation } from "../types/investigation";
import type { Report } from "../types/report";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    Promise.all([getInvestigationHistory(), getReport(id)])
      .then(([history, fetchedReport]) => {
        if (!isMounted) return;
        setInvestigation(history.investigations.find((inv) => inv.id === id) ?? null);
        setReport(fetchedReport);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load report.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) return <Spinner label="Loading report" />;

  if (error || !report || !investigation) {
    return (
      <Card>
        <p className="text-sm text-ink-muted">
          {error || "No report is available for this investigation yet."}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate("/reports")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to reports
        </Button>
      </Card>
    );
  }

  const recommendations = (report.recommendations || "")
    .split("\n")
    .map((line) => line.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/reports")}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </button>

      <Card>
        <CardHeader
          title={investigation.filename}
          description={`Generated ${formatDate(report.created_at)}`}
          action={
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => generateReportPdf(investigation, report)}
            >
              Download PDF
            </Button>
          }
        />
        <div className="flex flex-wrap items-center gap-6 text-sm">
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
        </div>
      </Card>

      <Card>
        <CardHeader title="Executive summary" />
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
          {report.summary || "No summary has been generated for this investigation yet."}
        </p>
      </Card>

      <Card>
        <CardHeader title="Recommendations" />
        <RecommendationsList recommendations={recommendations} />
      </Card>
    </div>
  );
}
