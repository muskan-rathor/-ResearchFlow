
import { api } from "./api";

export interface Paper {
  id: string;
  workspace_id: string;
  title: string;
  authors: string[] | null;
  abstract: string | null;
  original_filename: string;
  created_at: string;
  chunkCount?: number;
}

interface PaperListResponse {
  success: boolean;
  count: number;
  data: Paper[];
}

interface PaperUploadResponse {
  success: boolean;
  message: string;
  data: Paper;
}

export const getPapers = async (
  workspaceId: string
): Promise<Paper[]> => {
  const response = await api.get<PaperListResponse>(
    `/workspaces/${workspaceId}/papers`
  );

  return response.data.data;
};

export const uploadPaper = async (
  workspaceId: string,
  file: File,
  title: string
): Promise<Paper> => {
  const formData = new FormData();

  // Must match Multer's .single("paper")
  formData.append("paper", file);
  formData.append("title", title);

  const response = await api.post<PaperUploadResponse>(
    `/workspaces/${workspaceId}/papers`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 300000,
    }
  );

  return response.data.data;
};
