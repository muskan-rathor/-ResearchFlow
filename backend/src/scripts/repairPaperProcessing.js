
import fs from "fs/promises";
import path from "path";

import { pool } from "../config/database.js";
import { extractPdfText } from "../services/pdfService.js";
import { splitIntoChunks } from "../services/chunkService.js";
import { generateEmbeddings } from "../services/embeddingService.js";
import * as paperRepository from "../repositories/paperRepository.js";

const WORKSPACE_ID = "f9f2e107-6cdd-4166-acb4-26f6a8eec6b0";

const repairPapers = async () => {
  try {
    const result = await pool.query(
      `SELECT id, title, original_filename, file_path, extracted_text
       FROM papers
       WHERE workspace_id = $1
       ORDER BY created_at`,
      [WORKSPACE_ID]
    );

    console.log(`Found ${result.rows.length} paper records`);

    for (const paper of result.rows) {
      console.log(`\nProcessing: ${paper.original_filename}`);

      // Resolve the stored relative path to an absolute path.
      const pdfPath = path.resolve(process.cwd(), paper.file_path);

      // Check whether the original PDF exists.
      try {
        await fs.access(pdfPath);
      } catch {
        console.log("PDF missing. Skipping this record.");
        continue;
      }

      let extractedText = paper.extracted_text;

      // Step 1: Extract text only when it is missing.
      if (!extractedText || !extractedText.trim()) {
        console.log("Extracting PDF text...");

        extractedText = await extractPdfText(pdfPath);

        if (!extractedText.trim()) {
          console.log("No readable text found. Skipping.");
          continue;
        }

        await paperRepository.updateExtractedText(
          paper.id,
          extractedText
        );

        console.log("Extracted text saved.");
      } else {
        console.log("Extracted text already exists.");
      }

      // Step 2: Check whether chunks already exist.
      const chunkResult = await pool.query(
        `SELECT COUNT(*)::int AS total
         FROM paper_chunks
         WHERE paper_id = $1`,
        [paper.id]
      );

      let totalChunks = chunkResult.rows[0].total;

      // Generate chunks only when none exist.
      if (totalChunks === 0) {
        console.log("Generating chunks...");

        const chunks = splitIntoChunks(extractedText);

        const savedChunks = await paperRepository.savePaperChunks(
          paper.id,
          chunks
        );

        totalChunks = savedChunks.length;

        console.log(`Saved ${totalChunks} chunks.`);
      } else {
        console.log(`${totalChunks} chunks already exist.`);
      }

      // Step 3: Generate embeddings only for missing vectors.
      const missingResult = await pool.query(
        `SELECT id, content
         FROM paper_chunks
         WHERE paper_id = $1
           AND embedding IS NULL
         ORDER BY chunk_index`,
        [paper.id]
      );

      const missingChunks = missingResult.rows;

      if (missingChunks.length > 0) {
        console.log(
          `Generating ${missingChunks.length} missing embeddings...`
        );

        const embeddings = await generateEmbeddings(
          missingChunks.map((chunk) => chunk.content)
        );

        for (let i = 0; i < missingChunks.length; i++) {
          await paperRepository.updateChunkEmbedding(
            missingChunks[i].id,
            embeddings[i]
          );
        }

        console.log("Missing embeddings saved.");
      } else {
        console.log("All existing chunks already have embeddings.");
      }
    }

    console.log("\nPaper repair process completed.");
  } catch (error) {
    console.error("Repair failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

repairPapers();
