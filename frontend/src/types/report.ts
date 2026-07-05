export interface Report {
  id: string;
  investigation_id: string;
  summary: string | null;
  recommendations: string | null;
  pdf_path: string | null;
  created_at: string;
}

export interface ReportData {
  report: Report;
}
