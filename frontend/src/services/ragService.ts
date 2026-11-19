
import { api } from "./api";

export interface ResearchSource {
  sourceType: "paper_chunk" | "paper_metadata";
  paperId: string;
  paperTitle: string;
  chunkId?: string;
  chunkIndex?: number;
  similarity?: number;
  content?: string;
}

interface AskResponse {
  success: boolean;
  data: {
    answer: string;
    sources: ResearchSource[];
  };
}

export const askResearchQuestion = async (
  workspaceId: string,
  question: string
): Promise<AskResponse["data"]> => {
  const response = await api.post<AskResponse>(
    `/workspaces/${workspaceId}/ask`,
    { question }
  );

  return response.data.data;
};
