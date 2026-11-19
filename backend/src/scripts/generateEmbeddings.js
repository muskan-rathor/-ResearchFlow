
import "dotenv/config";
import { generateMissingEmbeddings } from "../services/embeddingBackfillService.js";

const run = async () => {
  try {
    const result = await generateMissingEmbeddings();

    console.log("Embedding generation completed!");
    console.log("Chunks processed:", result.processed);
  } catch (error) {
    console.error("Embedding generation failed:", error);
  }

  process.exit();
};

run();
