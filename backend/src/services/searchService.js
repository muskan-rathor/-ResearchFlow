
import { pool } from "../config/database.js";
import * as paperRepository from "../repositories/paperRepository.js";
import { generateEmbeddings } from "./embeddingService.js";

export const searchWorkspacePapers = async ({
  workspaceId,
  userId,
  query,
}) => {
  // 1. Verify workspace ownership
  const ownership = await pool.query(
    `SELECT id FROM workspaces
     WHERE id = $1 AND created_by = $2`,
    [workspaceId, userId]
  );

  if (ownership.rowCount === 0) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  // 2. Convert question into an embedding
  const [queryEmbedding] = await generateEmbeddings([query]);

  // 3. Find similar chunks
  const results = await paperRepository.searchSimilarChunks(
    workspaceId,
    queryEmbedding,
    5
  );

  return results;
};
