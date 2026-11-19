
import fs from "fs/promises";
import { pool } from "../config/database.js";
import * as paperRepository from "../repositories/paperRepository.js";
import { extractPdfText } from "./pdfService.js";
import { splitIntoChunks } from "./chunkService.js";
import { generateEmbeddings } from "./embeddingService.js";


export const createPaper = async ({
  workspaceId,
  userId,
  title,
  file,
}) => {
  // 1. Check workspace ownership
  const ownership = await pool.query(
    `SELECT id FROM workspaces
     WHERE id = $1 AND created_by = $2`,
    [workspaceId, userId]
  );

  if (ownership.rowCount === 0) {
    await fs.unlink(file.path).catch(() => {});

    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  try {
    // 2. Save paper metadata
    const paper = await paperRepository.createPaper({
      workspaceId,
      title,
      originalFilename: file.originalname,
      filePath: file.path,
    });

    // 3. Extract text from PDF
    const extractedText = await extractPdfText(file.path);

    // 4. Save extracted text
    await paperRepository.updateExtractedText(
      paper.id,
      extractedText
    );

    // 5. Split extracted text into chunks
    const chunks = splitIntoChunks(extractedText);

    // 6. Save chunks in PostgreSQL
    const savedChunks = await paperRepository.savePaperChunks(
  paper.id,
  chunks
);

// Generate embeddings for the new chunks
const embeddings = await generateEmbeddings(chunks);

// Save each embedding against its chunk
for (let i = 0; i < savedChunks.length; i++) {
  await paperRepository.updateChunkEmbedding(
    savedChunks[i].id,
    embeddings[i]
  );
}

    // 7. Return paper details
    return {
      ...paper,
      extractedText,
      chunkCount: savedChunks.length,
    };

  } catch (error) {
    await fs.unlink(file.path).catch(() => {});
    throw error;
  }
};


export const getPapersByWorkspace = async (workspaceId, userId) => {
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

  return paperRepository.getPapersByWorkspace(workspaceId);
};
