
import { GoogleGenAI } from "@google/genai";

const OLLAMA_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const generateWithGemini = async (
  prompt,
  { format, num_predict = 350, temperature = 0.2 } = {}
) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const config = {
    temperature,
    maxOutputTokens: num_predict,
  };

  if (format === "json") {
    config.responseMimeType = "application/json";
  } else if (format && typeof format === "object") {
    config.responseMimeType = "application/json";
    config.responseJsonSchema = format;
  }

  
const MAX_ATTEMPTS = 3;
let response;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    console.log(`Gemini request attempt ${attempt}/${MAX_ATTEMPTS}`);

    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: prompt,
      config,
    });

    break;
  } catch (error) {
    const status = error.status || error.code;

    const retryable = [429, 500, 502, 503, 504].includes(
      Number(status)
    );

    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw error;
    }

    const delay = 2000 * Math.pow(2, attempt - 1);

    console.warn(
      `Gemini temporarily unavailable (${status}). Retrying in ${delay / 1000}s...`
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

if (!response) {
  throw new Error("Gemini failed to generate a response");
}


  const answer = response.text;

  if (!answer) {
    throw new Error("Gemini returned an empty response");
  }

  return answer;
};

const generateWithOllama = async (
  prompt,
  {
    format,
    num_predict = 350,
    temperature = 0.2,
    num_ctx = 4096,
  } = {}
) => {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL || "qwen2.5:3b",
      prompt,
      stream: false,
      keep_alive: "10m",
      ...(format ? { format } : {}),
      options: {
        temperature,
        num_predict,
        num_ctx,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.response) {
    throw new Error("Ollama returned an empty response");
  }

  return data.response;
};

export const generateAnswer = async (prompt, options = {}) => {
  const provider = process.env.LLM_PROVIDER || "ollama";

  if (provider === "gemini") {
    return generateWithGemini(prompt, options);
  }

  if (provider === "ollama") {
    return generateWithOllama(prompt, options);
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
};
