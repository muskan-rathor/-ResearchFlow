
import { generateAnswer } from "../services/llmService.js";

const test = async () => {
  try {
    const answer = await generateAnswer(
      "Explain Retrieval-Augmented Generation in 3 simple sentences."
    );

    console.log("\nOllama Answer:\n", answer);
  } catch (error) {
    console.error("Ollama test failed:", error.message);
  }
};

test();
