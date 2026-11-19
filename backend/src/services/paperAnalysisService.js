
import * as paperRepository from "../repositories/paperRepository.js";
import { generateAnswer } from "./llmService.js";
import * as researchGapRepository from "../repositories/researchGapRepository.js";
import { pool } from "../config/database.js";
import { generateLimitationEmbeddings } from "./limitationEmbeddingService.js";

// ============================================
// 1. PARSE AND VALIDATE AI JSON RESPONSE
// ============================================

const parseJsonResponse = (response) => {
  if (!response || typeof response !== "string") {
    throw new Error("AI returned an empty response");
  }

  const cleaned = response
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    console.error("AI response did not contain a complete JSON object");
    console.error("Response preview:", cleaned.slice(0, 1500));

    throw new Error("AI returned incomplete JSON");
  }

  const jsonText = cleaned.slice(start, end + 1);

  let parsed;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error("JSON parsing failed:", error.message);
    console.error("Invalid JSON ending:", jsonText.slice(-1000));

    throw new Error("AI returned malformed JSON");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error("AI returned an invalid JSON object");
  }

  const requiredFields = [
    "research_problem",
    "methodology",
    "dataset",
    "limitations",
    "future_work",
    "key_findings",
  ];

  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`AI response missing required field: ${field}`);
    }
  }

  const textFields = [
    "research_problem",
    "methodology",
    "dataset",
    "key_findings",
  ];

  for (const field of textFields) {
    if (typeof parsed[field] !== "string") {
      throw new Error(`AI returned invalid ${field} format`);
    }
  }

  if (
    !Array.isArray(parsed.limitations) ||
    !Array.isArray(parsed.future_work) ||
    !parsed.limitations.every((item) => typeof item === "string") ||
    !parsed.future_work.every((item) => typeof item === "string")
  ) {
    throw new Error(
      "AI returned invalid limitations or future_work format"
    );
  }

  // Clean individual limitation and future-work entries.
  parsed.limitations = parsed.limitations
    .map((item) => item.trim())
    .filter(Boolean);

  parsed.future_work = parsed.future_work
    .map((item) => item.trim())
    .filter(Boolean);

  return parsed;
};


// ============================================
// 2. BUILD AI ANALYSIS PROMPT
// ============================================

const buildAnalysisPrompt = (paper) => {
  const paperText = paper.extracted_text.slice(0, 8000);

  return `
You are a precise academic research paper analysis assistant.

Analyze the supplied research paper and return ONLY one valid JSON object.

REQUIRED JSON STRUCTURE:

{
  "research_problem": "Short explanation of the problem addressed",
  "methodology": "Methods, algorithms and models used",
  "dataset": "Dataset description or Not specified",
  "limitations": [
    "First author-stated limitation",
    "Second author-stated limitation"
  ],
  "future_work": [
    "First explicitly mentioned future direction"
  ],
  "key_findings": "Summary of the main findings"
}

STRICT INSTRUCTIONS:

1. Return valid JSON only.
2. Use double quotes for all JSON keys and string values.
3. Do not include Markdown code fences.
4. Do not include explanations outside the JSON object.
5. Do not use trailing commas.
6. research_problem must be a string.
7. methodology must be a string.
8. dataset must be a string.
9. key_findings must be a string.
10. limitations MUST be an array of strings.
11. future_work MUST be an array of strings.
12. Extract author-stated limitations only.
13. Do not invent limitations or future work.
14. If no limitations are explicitly stated, return [].
15. If no future work is explicitly stated, return [].
16. If dataset information is unavailable, return "Not specified".
17. Keep descriptions concise and factual.
18. Ensure that every JSON bracket and quotation mark is properly closed.

PAPER TITLE:
${paper.title}

ORIGINAL FILENAME:
${paper.original_filename}

PAPER CONTENT:
${paperText}

Return the complete JSON object now.
`;
};


// ============================================
// 3. ANALYZE ALL UNIQUE WORKSPACE PAPERS
// ============================================

export const analyzeWorkspacePapers = async (workspaceId, userId) => {

  // STEP 1: Verify workspace ownership.
  const ownership = await pool.query(
    `SELECT id FROM workspaces
     WHERE id = $1 AND created_by = $2`,
    [workspaceId, userId]
  );

  if (ownership.rowCount === 0) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }


  // STEP 2: Fetch unique papers.
  const papers =
    await paperRepository.getUniquePapersForResearchAnalysis(
      workspaceId
    );

  if (!papers || papers.length === 0) {
    throw new Error("No papers with extracted text found");
  }

  const analyses = [];


  // STEP 3: Analyze papers sequentially.
  for (const paper of papers) {

    console.log(
      `\nStarting analysis: ${paper.original_filename}`
    );

    try {

      // Build prompt.
      const prompt = buildAnalysisPrompt(paper);

      // STEP 4: Request AI-generated JSON.
      const response = await generateAnswer(prompt, {
        format: "json",
        num_predict: 1200,
        temperature: 0,
        num_ctx: 4096,
      });

      console.log(
        `AI response received for: ${paper.original_filename}`
      );

      // STEP 5: Parse and validate response.
      const analysis = parseJsonResponse(response);

      // STEP 6: Save paper analysis.
      const savedAnalysis =
        await researchGapRepository.savePaperAnalysis(
          paper.id,
          analysis
        );

      // STEP 7: Save individual limitations.
      await researchGapRepository.saveResearchLimitations(
        savedAnalysis.id,
        paper.id,
        analysis.limitations
      );

      // STEP 8: Add analysis to API response.
      analyses.push({
        paperId: paper.id,
        filename: paper.original_filename,
        analysis,
      });

      console.log(
        `Analysis successfully saved: ${paper.original_filename}`
      );

    } catch (error) {

      console.error(
        `Analysis failed for ${paper.original_filename}:`,
        error.message
      );

      // Stop processing rather than silently returning
      // incomplete research analysis.
      throw error;
    }
  }


  // STEP 9: Generate embeddings for extracted limitations.
  const embeddingResult =
    await generateLimitationEmbeddings(workspaceId);

  console.log(
    "Limitation embedding result:",
    embeddingResult
  );


  // STEP 10: Return structured result.
  return {
    totalPapers: analyses.length,
    analyses,
  };
};
