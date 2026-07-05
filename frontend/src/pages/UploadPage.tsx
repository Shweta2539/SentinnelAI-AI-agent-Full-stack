import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, PlayCircle } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FileDropzone } from "../components/upload/FileDropzone";
import {
  InvestigationStatusTimeline,
  type PipelineStage,
} from "../components/investigation/InvestigationStatusTimeline";
import { uploadAndInvestigate } from "../services/investigationService";
import type { InvestigationResult } from "../types/investigation";

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [stage, setStage] = useState<PipelineStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvestigationResult | null>(null);

  const isRunning = stage === "running";

  const handleRun = async () => {
    if (!file) {
      setValidationError("Select a log file to continue.");
      return;
    }

    setValidationError(null);
    setError(null);
    setResult(null);
    setStage("running");
    setUploadProgress(0);

    try {
      const { result: investigationResult } = await uploadAndInvestigate(
        file,
        setUploadProgress
      );
      setResult(investigationResult);
      setStage("done");
    } catch (err) {
      setStage("failed");
      setError(err instanceof Error ? err.message : "The investigation failed to run.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Upload a log file"
          description="Text, CSV, or .log files are parsed for IPs, timestamps, and suspicious activity."
        />

        <FileDropzone
          file={file}
          onFileSelected={(selected) => {
            setFile(selected);
            setValidationError(selected ? null : validationError);
          }}
          disabled={isRunning}
          error={validationError}
        />

        {isRunning && (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-700">
              <motion.div
                className="h-full bg-signal"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-faint">
              {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : "Running the investigation pipeline…"}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button onClick={handleRun} isLoading={isRunning} leftIcon={<PlayCircle className="h-4 w-4" />}>
            {isRunning ? "Investigating" : "Start investigation"}
          </Button>
        </div>
      </Card>

      {(stage === "running" || stage === "done" || stage === "failed") && (
        <Card>
          <CardHeader
            title="Agent pipeline"
            description="Manager → Log Parser → Threat Analyst → Knowledge Agent → Report Generator"
          />
          <InvestigationStatusTimeline stage={stage} />
        </Card>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-alert-critical/30 bg-alert-critical/10 px-4 py-3 text-sm text-alert-critical">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && stage === "done" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader
              title="Investigation complete"
              description={`${result.investigation.filename} has been analyzed.`}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/investigations/${result.investigation.id}`)}
                >
                  View details <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              }
            />
            <p className="text-sm text-ink-muted">
              Attack type:{" "}
              <span className="font-medium text-ink">
                {result.investigation.attack_type ?? "Not determined"}
              </span>{" "}
              · Severity:{" "}
              <span className="font-medium text-ink">
                {(result.overall_severity ?? result.investigation.severity ?? "none").toUpperCase()}
              </span>
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
