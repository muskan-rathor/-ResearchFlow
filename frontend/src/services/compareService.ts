
import { api } from "./api";

export interface ComparisonPaper {
  paperId: string;
  title: string;
  sources: {
    chunkId: string;
    chunkIndex: number;
  }[];
}

export interface ComparisonResult {
  comparison: string;
  papers: ComparisonPaper[];
}

interface ComparisonResponse {
  success: boolean;
  data: ComparisonResult;
}

export const comparePapers = async (
  workspaceId: string,
  paperIds: string[]
): Promise<ComparisonResult> => {
  const response = await api.post<ComparisonResponse>(
    `/workspaces/${workspaceId}/compare`,
    { paperIds },
    { timeout: 300000 }
  );

  return response.data.data;
};
