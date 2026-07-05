import { motion } from "framer-motion";
import {
  BrainCircuit,
  Check,
  FileSearch,
  Loader2,
  ShieldAlert,
  BookOpenText,
  FileOutput,
} from "lucide-react";

export type PipelineStage = "idle" | "running" | "done" | "failed";

const AGENTS = [
  { key: "manager", label: "Incident Manager", icon: BrainCircuit },
  { key: "parser", label: "Log Parser", icon: FileSearch },
  { key: "threat", label: "Threat Analyst", icon: ShieldAlert },
  { key: "knowledge", label: "Knowledge Agent", icon: BookOpenText },
  { key: "report", label: "Report Generator", icon: FileOutput },
] as const;

interface InvestigationStatusTimelineProps {
  /** "idle" = not started, "running" = mid-pipeline, "done"/"failed" = finished */
  stage: PipelineStage;
}

export function InvestigationStatusTimeline({ stage }: InvestigationStatusTimelineProps) {
  return (
    <div className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-2">
      {AGENTS.map((agent, index) => {
        const isLast = index === AGENTS.length - 1;
        const state: "pending" | "active" | "complete" | "failed" =
          stage === "idle"
            ? "pending"
            : stage === "failed"
            ? index === AGENTS.length - 1
              ? "failed"
              : "complete"
            : stage === "done"
            ? "complete"
            : index === 0
            ? "active"
            : "pending";

        return (
          <div key={agent.key} className="flex flex-1 items-start gap-3 sm:flex-col sm:gap-2">
            <div className="flex flex-col items-center sm:w-full">
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  state === "complete" &&
                    "border-signal bg-signal/10 text-signal",
                  state === "active" &&
                    "border-signal bg-signal/10 text-signal",
                  state === "pending" &&
                    "border-border-light bg-base-800 text-ink-faint",
                  state === "failed" &&
                    "border-alert-critical bg-alert-critical/10 text-alert-critical",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {state === "complete" && <Check className="h-4 w-4" />}
                {state === "active" && <Loader2 className="h-4 w-4 animate-spin" />}
                {state === "pending" && <agent.icon className="h-4 w-4" />}
                {state === "failed" && <agent.icon className="h-4 w-4" />}
              </div>
              {!isLast && (
                <div className="mx-4 mt-1 h-6 w-px bg-border-light sm:mx-0 sm:mt-2 sm:h-px sm:w-full">
                  <motion.div
                    className="h-full bg-signal"
                    initial={{ width: 0, height: 0 }}
                    animate={
                      state === "complete"
                        ? { width: "100%", height: "100%" }
                        : { width: 0, height: 0 }
                    }
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
            <p
              className={[
                "pb-4 text-xs font-medium sm:pb-0 sm:text-center",
                state === "pending" ? "text-ink-faint" : "text-ink",
              ].join(" ")}
            >
              {agent.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
