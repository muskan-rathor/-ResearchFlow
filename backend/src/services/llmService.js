
const OLLAMA_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export const generateAnswer = async (
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
