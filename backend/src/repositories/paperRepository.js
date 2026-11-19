
import { pool } from "../config/database.js";

export const createPaper = async ({
  workspaceId,
  title,
  originalFilename,
  filePath,
}) => {
  const result = await pool.query(
    `INSERT INTO papers
      (workspace_id, title, original_filename, file_path)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [workspaceId, title, originalFilename, filePath]
  );

  return result.rows[0];
};


export const getPapersByWorkspace = async (workspaceId) => {
  const result = await pool.query(
    `SELECT id, workspace_id, title, authors,
            abstract, original_filename, created_at
     FROM papers
     WHERE workspace_id = $1
     ORDER BY created_at DESC`,
    [workspaceId]
  );

  return result.rows;
};



export const updateExtractedText = async (paperId, extractedText) => {
  const result = await pool.query(
    `UPDATE papers
     SET extracted_text = $1
     WHERE id = $2
     RETURNING id, title, extracted_text`,
    [extractedText, paperId]
  );

  return result.rows[0];
};



export const savePaperChunks = async (paperId, chunks) => {
  if (chunks.length === 0) return [];

  const values = [];
  const placeholders = chunks.map((content, index) => {
    const position = index * 3;

    values.push(paperId, index, content);

    return `($${position + 1}, $${position + 2}, $${position + 3})`;
  });

  const result = await pool.query(
    `INSERT INTO paper_chunks (paper_id, chunk_index, content)
     VALUES ${placeholders.join(", ")}
     RETURNING id, paper_id, chunk_index`,
    values
  );

  return result.rows;
};


export const getChunksWithoutEmbeddings = async () => {
  const result = await pool.query(
    `SELECT id, content
     FROM paper_chunks
     WHERE embedding IS NULL
     ORDER BY created_at ASC`
  );

  return result.rows;
};

export const updateChunkEmbedding = async (chunkId, embedding) => {
  const vector = `[${embedding.join(",")}]`;

  await pool.query(
    `UPDATE paper_chunks
     SET embedding = $1::vector
     WHERE id = $2`,
    [vector, chunkId]
  );
};



export const searchSimilarChunks = async (
  workspaceId,
  queryEmbedding,
  limit = 5
) => {
  const vector = `[${queryEmbedding.join(",")}]`;

  const result = await pool.query(
    `SELECT
       pc.id AS chunk_id,
       pc.paper_id,
       pc.chunk_index,
       pc.content,
       p.title AS paper_title,
       1 - (pc.embedding <=> $1::vector) AS similarity
     FROM paper_chunks pc
     JOIN papers p ON p.id = pc.paper_id
     WHERE p.workspace_id = $2
       AND pc.embedding IS NOT NULL
     ORDER BY pc.embedding <=> $1::vector
     LIMIT $3`,
    [vector, workspaceId, limit]
  );

  return result.rows;
};



export const getPaperChunksForComparison = async (
  workspaceId,
  paperIds
) => {
  const result = await pool.query(
    `SELECT
       p.id AS paper_id,
       p.title AS paper_title,
       p.authors,
       p.abstract,
       pc.id AS chunk_id,
       pc.chunk_index,
       pc.content
     FROM papers p
     LEFT JOIN LATERAL (
       SELECT id, chunk_index, content
       FROM paper_chunks
       WHERE paper_id = p.id
       ORDER BY chunk_index
       LIMIT 4
     ) pc ON true
     WHERE p.workspace_id = $1
       AND p.id = ANY($2::uuid[])
     ORDER BY p.id, pc.chunk_index`,
    [workspaceId, paperIds]
  );

  return result.rows;
};



export const getPapersForResearchAnalysis = async (workspaceId) => {
  const result = await pool.query(
    `SELECT
       id,
       title,
       original_filename,
       extracted_text
     FROM papers
     WHERE workspace_id = $1
       AND extracted_text IS NOT NULL
       AND TRIM(extracted_text) <> ''
     ORDER BY created_at ASC`,
    [workspaceId]
  );

  return result.rows;
};




export const getUniquePapersForResearchAnalysis = async (workspaceId) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (MD5(p.extracted_text))
        p.id,
        p.title,
        p.original_filename,
        p.extracted_text,
        MD5(p.extracted_text) AS content_hash
     FROM papers p
     WHERE p.workspace_id = $1
       AND p.extracted_text IS NOT NULL
       AND TRIM(p.extracted_text) <> ''
     ORDER BY MD5(p.extracted_text), p.created_at ASC`,
    [workspaceId]
  );

  return result.rows;
};
