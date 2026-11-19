
import { api } from "./api";

// Common API response structure
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Analyze uploaded research papers
export const analyzeResearchGaps = async (
  workspaceId: string
) => {
  const response = await api.post<ApiResponse<unknown>>(
    `/workspaces/${workspaceId}/research-gaps/analyze`,
    {},
    { timeout: 600000 }
  );

  return response.data.data;
};

// Cluster extracted limitations
export const clusterResearchGaps = async (
  workspaceId: string
) => {
  const response = await api.post<ApiResponse<unknown>>(
    `/workspaces/${workspaceId}/research-gaps/cluster`,
    {},
    { timeout: 300000 }
  );

  return response.data.data;
};

// Calculate cluster recurrence
export const getResearchGapRecurrence = async (
  workspaceId: string
) => {
  const response = await api.get<ApiResponse<unknown>>(
    `/workspaces/${workspaceId}/research-gaps/recurrence`
  );

  return response.data.data;
};

// Generate AI interpretations of clusters
export const interpretResearchGaps = async (
  workspaceId: string
) => {
  const response = await api.post<ApiResponse<unknown>>(
    `/workspaces/${workspaceId}/research-gaps/interpret`,
    {},
    { timeout: 300000 }
  );

  return response.data.data;
};

// Generate and save research gap report
export const generateResearchGapReport = async (
  workspaceId: string,
  focus: string
) => {
  const response = await api.post<ApiResponse<unknown>>(
    `/workspaces/${workspaceId}/research-gaps/reports/generate`,
    { focus },
    { timeout: 600000 }
  );

  return response.data.data;
};

// Fetch all saved reports
export const getResearchGapReports = async (
  workspaceId: string
) => {
  const response = await api.get<ApiResponse<unknown[]>>(
    `/workspaces/${workspaceId}/research-gaps/reports`
  );

  return response.data.data;
};

// Fetch one saved report
export const getResearchGapReport = async (
  workspaceId: string,
  reportId: string
) => {
  const response = await api.get<ApiResponse<unknown>>(
    `/workspaces/${workspaceId}/research-gaps/reports/${reportId}`
  );

  return response.data.data;
};
