import { getReport } from "../api/reportApi";
import { generateReportPdf } from "../utils/pdfGenerator";
import type { Investigation } from "../types/investigation";
import type { Report } from "../types/report";

/**
 * Fetch a report and immediately trigger a client-side PDF download.
 * The backend currently persists reports as Markdown (`pdf_path` points at
 * a .md file); real server-side PDF export is a planned addition. Until
 * then, this generates a clean PDF on the client from the same data.
 */
export async function fetchAndDownloadReportPdf(
  investigation: Investigation
): Promise<Report> {
  const report = await getReport(investigation.id);
  generateReportPdf(investigation, report);
  return report;
}
