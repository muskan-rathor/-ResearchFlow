
import { api } from "./api";

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface WorkspaceListResponse {
  success: boolean;
  count: number;
  data: Workspace[];
}

interface WorkspaceResponse {
  success: boolean;
  message?: string;
  data: Workspace;
}

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const response = await api.get<WorkspaceListResponse>("/workspaces");
  return response.data.data;
};

export const createWorkspace = async (data: {
  name: string;
  description: string;
}): Promise<Workspace> => {
  const response = await api.post<WorkspaceResponse>("/workspaces", data);
  return response.data.data;
};

export const getWorkspaceById = async (
  id: string
): Promise<Workspace> => {
  const response = await api.get<WorkspaceResponse>(`/workspaces/${id}`);
  return response.data.data;
};

export const updateWorkspace = async (
  id: string,
  data: { name: string; description: string }
): Promise<Workspace> => {
  const response = await api.put<WorkspaceResponse>(
    `/workspaces/${id}`,
    data
  );
  return response.data.data;
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  await api.delete(`/workspaces/${id}`);
};
