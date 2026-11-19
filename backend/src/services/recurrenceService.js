
import * as researchGapRepository from "../repositories/researchGapRepository.js";

export const calculateClusterRecurrence = async (workspaceId) => {
  const clusters =
    await researchGapRepository.getClusterRecurrence(workspaceId);

  const results = clusters.map((cluster) => {
    const totalPapers = Number(cluster.total_unique_papers);
    const paperCount = Number(cluster.paper_count);

    const recurrencePercentage =
      totalPapers > 0
        ? Number(((paperCount / totalPapers) * 100).toFixed(2))
        : 0;

    return {
      clusterId: cluster.cluster_id,
      limitationCount: Number(cluster.limitation_count),
      papersWithTheme: paperCount,
      totalPapers,
      recurrencePercentage,
      limitations: cluster.limitations
    };
  });

  return {
    totalClusters: results.length,
    totalUniquePapers:
      results.length > 0 ? results[0].totalPapers : 0,
    clusters: results
  };
};
