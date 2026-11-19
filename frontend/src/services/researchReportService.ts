
import { api } from "./api";

export interface ResearchReport {
  id: string;
  workspace_id: string;
  focus: string | null;
  report: Record<string, unknown>;
  created_at: string;
}

interface ReportListResponse {
  success: boolean;
  count: number;
  data: ResearchReport[];
}

interface ReportResponse {
  success: boolean;
  data: ResearchReport;
}

// Fetch all saved reports for a workspace.
export const getResearchReports = async (
  workspaceId: string
): Promise<ResearchReport[]> => {
  const response = await api.get<ReportListResponse>(
    `/workspaces/${workspaceId}/research-gaps/reports`
  );

  return response.data.data;
};

// Fetch one saved report.
export const getResearchReportById = async (
  workspaceId: string,
  reportId: string
): Promise<ResearchReport> => {
  const response = await api.get<ReportResponse>(
    `/workspaces/${workspaceId}/research-gaps/reports/${reportId}`
  );

  return response.data.data;
};
