
import * as paperRepository from "../repositories/paperRepository.js";
import { generateEmbeddings } from "./embeddingService.js";

export const generateMissingEmbeddings = async () => {
  const chunks = await paperRepository.getChunksWithoutEmbeddings();

  if (chunks.length === 0) {
    return { processed: 0 };
  }

  // Generate embeddings for all retrieved chunks
  const texts = chunks.map((chunk) => chunk.content);

  const embeddings = await generateEmbeddings(texts);

  // Save each embedding against its original chunk
  for (let i = 0; i < chunks.length; i++) {
    await paperRepository.updateChunkEmbedding(
      chunks[i].id,
      embeddings[i]
    );
  }

  return {
    processed: chunks.length,
  };
};
