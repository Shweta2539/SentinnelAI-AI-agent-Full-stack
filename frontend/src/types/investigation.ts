export type InvestigationStatus =
  | "uploaded"
  | "investigating"
  | "completed"
  | "failed";

export type Severity = "critical" | "high" | "medium" | "low" | "none";

export interface Investigation {
  id: string;
  user_id: string;
  filename: string;
  attack_type: string | null;
  severity: string | null;
  status: InvestigationStatus | string;
  created_at: string;
}

export interface ThreatFinding {
  threat_type: string;
  severity: string;
  confidence?: string;
  evidence?: string[];
  description?: string;
}

/**
 * Shape returned by POST /investigate/{id}. The backend's AI pipeline is
 * evolving, so every field beyond `investigation` is treated as optional —
 * the UI degrades gracefully if a given run doesn't include them yet.
 */
export interface InvestigationResult {
  investigation: Investigation;
  threats?: ThreatFinding[];
  overall_severity?: string;
  executive_summary?: string;
  timeline?: string[];
  recommendations?: string[];
  report_path?: string;
  status?: string;
}

export interface UploadResultData {
  investigation: Investigation;
}

export interface HistoryData {
  investigations: Investigation[];
  count: number;
}
