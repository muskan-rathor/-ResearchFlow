
import * as researchGapRepository from "../repositories/researchGapRepository.js";

// Experimental threshold. We will tune it after inspecting results.
const SIMILARITY_THRESHOLD = 0.75;

// Convert PostgreSQL vector text into a JavaScript array.
const parseEmbedding = (embeddingText) => {
  const values = String(embeddingText)
    .replace(/^\s*\[|\]\s*$/g, "")
    .split(",")
    .map(Number);

  if (
    values.length !== 384 ||
    !values.every(Number.isFinite)
  ) {
    throw new Error("Invalid embedding vector. Expected 384 numbers.");
  }

  return values;
};

// Calculate cosine similarity between two vectors.
const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) {
    throw new Error("Embedding dimensions do not match.");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct /
    (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

// Union-Find: find the root group of an item.
const find = (parent, item) => {
  if (parent[item] !== item) {
    parent[item] = find(parent, parent[item]);
  }

  return parent[item];
};

// Union-Find: connect two groups.
const union = (parent, rank, a, b) => {
  const rootA = find(parent, a);
  const rootB = find(parent, b);

  if (rootA === rootB) return;

  if (rank[rootA] < rank[rootB]) {
    parent[rootA] = rootB;
  } else if (rank[rootA] > rank[rootB]) {
    parent[rootB] = rootA;
  } else {
    parent[rootB] = rootA;
    rank[rootA]++;
  }
};

export const clusterWorkspaceLimitations = async (workspaceId) => {

  // 1. Fetch limitations with embeddings.
  const limitations =
    await researchGapRepository.getEmbeddedLimitations(workspaceId);

  if (limitations.length === 0) {
    return {
      totalLimitations: 0,
      totalClusters: 0,
      clusters: []
    };
  }

  // 2. Parse embedding vectors.
  const vectors = limitations.map(item =>
    parseEmbedding(item.embedding)
  );

  // 3. Initialize Union-Find.
  const parent = limitations.map((_, index) => index);
  const rank = limitations.map(() => 0);

  // 4. Compare every pair of limitations.
  const similarityMatches = [];

  for (let i = 0; i < limitations.length; i++) {
    for (let j = i + 1; j < limitations.length; j++) {

      const similarity = cosineSimilarity(
        vectors[i],
        vectors[j]
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        union(parent, rank, i, j);

        similarityMatches.push({
          limitationA: limitations[i].id,
          limitationB: limitations[j].id,
          similarity: Number(similarity.toFixed(4))
        });
      }
    }
  }

  // 5. Group limitations by their connected component.
  const groups = new Map();

  for (let i = 0; i < limitations.length; i++) {
    const root = find(parent, i);

    if (!groups.has(root)) {
      groups.set(root, []);
    }

    groups.get(root).push(limitations[i]);
  }

  // 6. Assign sequential cluster IDs and save them.
  const clusters = [];
  let clusterId = 1;

  for (const members of groups.values()) {

    for (const limitation of members) {
      await researchGapRepository.updateLimitationCluster(
        limitation.id,
        clusterId
      );
    }

    clusters.push({
      clusterId,
      limitationCount: members.length,
      paperIds: [...new Set(
        members.map(item => item.paper_id)
      )],
      limitations: members.map(item => ({
        id: item.id,
        paperId: item.paper_id,
        text: item.limitation_text
      }))
    });

    clusterId++;
  }

  return {
    totalLimitations: limitations.length,
    totalClusters: clusters.length,
    similarityThreshold: SIMILARITY_THRESHOLD,
    similarityMatches,
    clusters
  };
};
