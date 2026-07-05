import { axiosClient } from "./axiosClient";
import type { ApiResponse } from "../types/api";
import type { Report } from "../types/report";

export async function getReport(investigationId: string): Promise<Report> {
  const { data } = await axiosClient.get<ApiResponse<{ report: Report }>>(
    `/report/${investigationId}`
  );
  return unwrap(data).report;
}

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new Error(response.message || "Request did not return any data.");
  }
  return response.data;
}
