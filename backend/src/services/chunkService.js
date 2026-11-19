
export const splitIntoChunks = (text, chunkSize = 1000, overlap = 200) => {
  const cleanText = text.trim();

  if (!cleanText) return [];

  const chunks = [];
  let start = 0;

  while (start < cleanText.length) {
    const end = Math.min(start + chunkSize, cleanText.length);

    const content = cleanText.slice(start, end).trim();

    if (content) {
      chunks.push(content);
    }

    if (end === cleanText.length) break;

    start += chunkSize - overlap;
  }

  return chunks;
};
