import { jsPDF } from "jspdf";
import type { Investigation } from "../types/investigation";
import type { Report } from "../types/report";
import { formatDate } from "./formatters";

const PAGE_MARGIN = 48;
const LINE_HEIGHT = 16;

/**
 * Render a Report + its parent Investigation into a downloadable PDF,
 * entirely on the client. This stands in for server-side PDF export
 * (currently the backend only persists the report as Markdown) — once
 * that lands, this can be replaced with a direct file download.
 */
export function generateReportPdf(investigation: Investigation, report: Report): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  let cursorY = PAGE_MARGIN;

  const ensureSpace = (linesNeeded: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (cursorY + linesNeeded * LINE_HEIGHT > pageHeight - PAGE_MARGIN) {
      doc.addPage();
      cursorY = PAGE_MARGIN;
    }
  };

  const writeHeading = (text: string) => {
    ensureSpace(2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 30, 45);
    doc.text(text, PAGE_MARGIN, cursorY);
    cursorY += LINE_HEIGHT * 1.4;
  };

  const writeBody = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(45, 55, 72);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      ensureSpace(1);
      doc.text(line, PAGE_MARGIN, cursorY);
      cursorY += LINE_HEIGHT;
    });
    cursorY += LINE_HEIGHT * 0.5;
  };

  // --- Title block --------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text("SentinelAI Incident Report", PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT * 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Investigation ID: ${investigation.id}`, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT;
  doc.text(`Source file: ${investigation.filename}`, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT;
  doc.text(`Generated: ${formatDate(report.created_at)}`, PAGE_MARGIN, cursorY);
  cursorY += LINE_HEIGHT * 2;

  // --- Key facts -----------------------------------------------------------
  writeHeading("Overview");
  writeBody(
    `Detected attack type: ${investigation.attack_type ?? "Not yet determined"}`
  );
  writeBody(`Severity: ${(investigation.severity ?? "none").toUpperCase()}`);
  writeBody(`Status: ${investigation.status}`);

  // --- Executive summary ---------------------------------------------------
  writeHeading("Executive Summary");
  writeBody(report.summary || "No summary has been generated for this investigation yet.");

  // --- Recommendations -------------------------------------------------------
  writeHeading("Recommendations");
  if (report.recommendations) {
    report.recommendations
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => writeBody(`\u2022 ${line.replace(/^[-•]\s*/, "")}`));
  } else {
    writeBody("No recommendations have been generated for this investigation yet.");
  }

  doc.save(`sentinelai-report-${investigation.id}.pdf`);
}
