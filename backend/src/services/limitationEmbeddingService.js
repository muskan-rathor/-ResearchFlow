
import { generateEmbeddings } from "./embeddingService.js";
import * as researchGapRepository from "../repositories/researchGapRepository.js";

export const generateLimitationEmbeddings = async (workspaceId) => {
  // 1. Fetch limitations that don't have embeddings yet.
  const limitations =
    await researchGapRepository.getLimitationsWithoutEmbeddings(
      workspaceId
    );

  if (limitations.length === 0) {
    return {
      message: "All limitations already have embeddings.",
      totalEmbedded: 0
    };
  }

  console.log(
    `Generating embeddings for ${limitations.length} limitations...`
  );

  // 2. Extract limitation text.
  const texts = limitations.map(
    (limitation) => limitation.limitation_text
  );

  // 3. Generate 384-dimensional vectors using MiniLM.
  const embeddings = await generateEmbeddings(texts);

  if (embeddings.length !== limitations.length) {
    throw new Error("Embedding count does not match limitation count.");
  }

  // 4. Save each vector against its limitation.
  for (let i = 0; i < limitations.length; i++) {
    if (embeddings[i].length !== 384) {
      throw new Error("Invalid embedding dimension. Expected 384.");
    }

    await researchGapRepository.updateLimitationEmbedding(
      limitations[i].id,
      embeddings[i]
    );

    console.log(
      `Embedded limitation ${i + 1}/${limitations.length}`
    );
  }

  return {
    message: "Limitation embeddings generated successfully.",
    totalEmbedded: limitations.length
  };
};
