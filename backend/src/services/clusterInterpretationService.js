
import { generateAnswer } from "./llmService.js";
import { calculateClusterRecurrence } from "./recurrenceService.js";

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

  if (start === -1 || end < start) {
    throw new Error("AI did not return valid JSON");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
};

export const interpretResearchClusters = async (workspaceId) => {

  // 1. Get existing cluster and recurrence information.
  const recurrence =
    await calculateClusterRecurrence(workspaceId);

  if (recurrence.totalClusters === 0) {
    return {
      totalClusters: 0,
      interpretations: []
    };
  }

  // 2. Prepare cluster information for Qwen.
  const clusterData = recurrence.clusters.map(cluster => ({
    clusterId: cluster.clusterId,
    recurrencePercentage: cluster.recurrencePercentage,
    papersWithTheme: cluster.papersWithTheme,
    totalPapers: cluster.totalPapers,
    limitations: cluster.limitations
  }));

  const prompt = `
You are an academic research theme analysis assistant.

Analyze the following clusters of research limitations.

For EACH cluster:
1. Give it a concise and meaningful research theme.
2. Explain the common challenge represented by its limitations.
3. Describe the underlying research challenge.
4. Suggest potential research directions.

IMPORTANT RULES:
- Use only the supplied limitations.
- Do not invent findings or author claims.
- Do not claim that a research gap is novel or proven.
- Potential research directions are your own suggestions.
- Preserve the original cluster IDs.
- Do not merge different clusters.
- Return one interpretation for every supplied cluster.
- Return valid JSON only.

Expected JSON structure:

{
  "interpretations": [
    {
      "clusterId": 1,
      "theme": "Short research theme",
      "description": "Common meaning of the limitations",
      "research_challenge": "Underlying research challenge",
      "potential_directions": [
        "Potential direction 1",
        "Potential direction 2"
      ]
    }
  ]
}

CLUSTER DATA:

${JSON.stringify(clusterData, null, 2)}
`;

  // 3. Ask Qwen to interpret all clusters in one request.
  const response = await generateAnswer(prompt, {
    format: "json",
    num_predict: 1400,
    temperature: 0.1,
    num_ctx: 4096
  });

  // 4. Parse and validate AI response.
  const result = parseJsonResponse(response);

  if (!Array.isArray(result.interpretations)) {
    throw new Error("Invalid cluster interpretations returned by AI");
  }

  const suppliedIds = new Set(
    clusterData.map(cluster => cluster.clusterId)
  );

  const seenIds = new Set();

  for (const item of result.interpretations) {
    if (
      !Number.isInteger(item.clusterId) ||
      !suppliedIds.has(item.clusterId) ||
      seenIds.has(item.clusterId) ||
      typeof item.theme !== "string" ||
      typeof item.description !== "string" ||
      typeof item.research_challenge !== "string" ||
      !Array.isArray(item.potential_directions) ||
      !item.potential_directions.every(
        direction => typeof direction === "string"
      )
    ) {
      throw new Error("AI returned an invalid cluster interpretation");
    }

    seenIds.add(item.clusterId);
  }

  if (seenIds.size !== suppliedIds.size) {
    throw new Error("AI did not interpret every cluster");
  }

  // 5. Combine AI interpretation with original recurrence data.
  const interpretations = clusterData.map(cluster => {
    const interpretation = result.interpretations.find(
      item => item.clusterId === cluster.clusterId
    );

    return {
      ...cluster,
      ...interpretation
    };
  });

  return {
    totalClusters: interpretations.length,
    totalUniquePapers: recurrence.totalUniquePapers,
    interpretations
  };
};
