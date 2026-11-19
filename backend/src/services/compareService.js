
import { pool } from "../config/database.js";
import * as paperRepository from "../repositories/paperRepository.js";
import { generateAnswer } from "./llmService.js";

export const compareResearchPapers = async ({
  workspaceId,
  userId,
  paperIds,
}) => {
  // 1. Validate workspace ownership
  const ownership = await pool.query(
    `SELECT id
     FROM workspaces
     WHERE id = $1 AND created_by = $2`,
    [workspaceId, userId]
  );

  if (ownership.rowCount === 0) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Retrieve both papers and their chunks
  const rows = await paperRepository.getPaperChunksForComparison(
    workspaceId,
    paperIds
  );

  const paperMap = new Map();

  for (const row of rows) {
    if (!paperMap.has(row.paper_id)) {
      paperMap.set(row.paper_id, {
        paperId: row.paper_id,
        title: row.paper_title,
        authors: row.authors,
        abstract: row.abstract,
        chunks: [],
      });
    }

    if (row.chunk_id) {
      paperMap.get(row.paper_id).chunks.push({
        chunkId: row.chunk_id,
        chunkIndex: row.chunk_index,
        content: row.content,
      });
    }
  }

  if (paperMap.size !== 2) {
    const error = new Error(
      "One or both papers were not found in this workspace"
    );
    error.statusCode = 404;
    throw error;
  }

  const papers = Array.from(paperMap.values());

  // 3. Construct context for the LLM
  const context = papers.map((paper, index) => `
PAPER ${index + 1}
Title: ${paper.title}
Authors: ${paper.authors || "Not available"}
Abstract: ${paper.abstract || "Not available"}

CONTENT:
${paper.chunks.map((chunk) =>
  `[Chunk ${chunk.chunkIndex}]\n${chunk.content}`
).join("\n\n")}
`).join("\n\n----------------------\n\n");

  // 4. Ask Qwen to compare the papers
  const prompt = `
You are ResearchFlow, an academic research comparison assistant.

Compare the following two research papers using ONLY the supplied information.

Analyze these aspects:
1. Research problem
2. Proposed methodology
3. Dataset and input features
4. Models or algorithms
5. Evaluation metrics and results
6. Limitations

Rules:
- Clearly distinguish Paper 1 and Paper 2.
- Do not invent missing datasets, results or limitations.
- If information is unavailable, write "Not specified in the provided content".
- Explain similarities and differences.
- Use clear headings and concise language.

RESEARCH PAPERS:
${context}

Provide the comparison now.
`;

  const comparison = await generateAnswer(prompt);

  // 5. Return comparison and traceable source information
  return {
    comparison,
    papers: papers.map((paper) => ({
      paperId: paper.paperId,
      title: paper.title,
      sources: paper.chunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
      })),
    })),
  };
};
