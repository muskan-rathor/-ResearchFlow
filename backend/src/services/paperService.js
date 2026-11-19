
import fs from "fs/promises";
import { randomUUID } from "crypto";

import { pool } from "../config/database.js";
import { supabase, STORAGE_BUCKET } from "../config/supabase.js";

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
  let storagePath = null;
  let paperCreated = false;

  try {
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

    // 2. Extract PDF text from temporary local file
    const extractedText = await extractPdfText(file.path);

    if (!extractedText.trim()) {
      const error = new Error("Could not extract text from this PDF");
      error.statusCode = 400;
      throw error;
    }

    // 3. Generate a unique object path
    const paperId = randomUUID();

    storagePath = `${workspaceId}/${paperId}.pdf`;

    // 4. Read temporary PDF
    const fileBuffer = await fs.readFile(file.path);

    // 5. Upload original PDF to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    console.log("PDF uploaded to Supabase Storage:", storagePath);

    // 6. Save paper metadata in PostgreSQL
    // file_path now stores the Supabase object path
    const paper = await paperRepository.createPaper({
      workspaceId,
      title,
      originalFilename: file.originalname,
      filePath: storagePath,
    });

    paperCreated = true;

    // 7. Save extracted text
    await paperRepository.updateExtractedText(
      paper.id,
      extractedText
    );

    // 8. Split extracted text into chunks
    const chunks = splitIntoChunks(extractedText);

    // 9. Save chunks in PostgreSQL
    const savedChunks = await paperRepository.savePaperChunks(
      paper.id,
      chunks
    );

    // 10. Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    if (embeddings.length !== savedChunks.length) {
      throw new Error("Embedding count does not match chunk count");
    }

    // 11. Save embeddings
    for (let i = 0; i < savedChunks.length; i++) {
      await paperRepository.updateChunkEmbedding(
        savedChunks[i].id,
        embeddings[i]
      );
    }

    console.log(
      `Paper processed successfully: ${savedChunks.length} chunks embedded`
    );

    return {
      ...paper,
      extractedText,
      chunkCount: savedChunks.length,
    };

  } catch (error) {
    // Remove uploaded object if processing failed
    if (storagePath && !paperCreated) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath])
        .catch((cleanupError) => {
          console.error("Storage cleanup failed:", cleanupError);
        });
    }

    throw error;

  } finally {
    // Always remove temporary Render filesystem copy
    if (file?.path) {
      await fs.unlink(file.path).catch(() => {});
    }
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
