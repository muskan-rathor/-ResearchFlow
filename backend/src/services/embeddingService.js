
import { pipeline } from "@huggingface/transformers";

let extractor = null;

// Load the model only once
const getExtractor = async () => {
  if (!extractor) {
    console.log("Loading local embedding model...");

    extractor = await pipeline(
      "feature-extraction",
      "onnx-community/all-MiniLM-L6-v2-ONNX"
    );

    console.log("Embedding model loaded!");
  }

  return extractor;
};


export const generateEmbeddings = async (texts) => {
  if (!texts.length) return [];

  const model = await getExtractor();

  const BATCH_SIZE = 2;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    console.log(
      `Generating embeddings: ${Math.min(i + BATCH_SIZE, texts.length)}/${texts.length}`
    );

    const output = await model(batch, {
      pooling: "mean",
      normalize: true
    });

    allEmbeddings.push(...output.tolist());
  }

  return allEmbeddings;
};
