import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type {
  HistoryData,
  InvestigationResult,
  UploadResultData,
} from "../types/investigation";

export async function uploadLogFile(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResultData> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await axiosClient.post<ApiResponse<UploadResultData>>(
    "/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    }
  );

  return unwrap(data);
}

export async function startInvestigation(
  investigationId: string
): Promise<InvestigationResult> {
  const { data } = await axiosClient.post<ApiResponse<InvestigationResult>>(
    `/investigate/${investigationId}`
  );
  return unwrap(data);
}

export async function getInvestigationHistory(): Promise<HistoryData> {
  const { data } = await axiosClient.get<ApiResponse<HistoryData>>("/history");
  return unwrap(data);
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new Error(response.message || "Request did not return any data.");
  }
  return response.data;
}
