import { startInvestigation, uploadLogFile } from "../api/investigationApi";
import type { InvestigationResult, UploadResultData } from "../types/investigation";

/**
 * Higher-level workflow used by the Upload page: persist the file, then
 * immediately kick off the LangGraph investigation for it. Kept separate
 * from `api/investigationApi.ts` (which only knows about single HTTP
 * calls) so pages don't have to sequence the two requests themselves.
 */
export async function uploadAndInvestigate(
  file: File,
  onUploadProgress?: (percent: number) => void
): Promise<{ upload: UploadResultData; result: InvestigationResult }> {
  const upload = await uploadLogFile(file, onUploadProgress);
  const result = await startInvestigation(upload.investigation.id);
  return { upload, result };
}
