
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

export const extractPdfText = async (filePath) => {
  const buffer = await fs.readFile(filePath);

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    // Remove NULL characters before saving to PostgreSQL
    const cleanText = result.text.replace(/\u0000/g, "");

    return cleanText;
  } finally {
    await parser.destroy();
  }
};
