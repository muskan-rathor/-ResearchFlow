
import { searchOpenAlex } from "./openAlexService.js";
import { interpretResearchClusters } from "./clusterInterpretationService.js";

// Identify the research domain using the cluster's theme and limitations.
const getSearchProfile = (cluster) => {
  const text = [
    cluster.theme,
    ...cluster.limitations,
  ].join(" ").toLowerCase();

  if (/mac address|spoofing|physical.?layer authentication|\bpla\b/.test(text)) {
    return {
      query: "wireless MAC spoofing physical layer authentication CSI",
      keywords: [
        "wireless",
        "spoofing",
        "authentication",
        "MAC",
        "physical layer",
        "CSI",
      ],
    };
  }

  if (/authentication|false positive|false negative/.test(text)) {
    return {
      query:
        "wireless physical layer authentication CSI false acceptance false rejection",
      keywords: [
        "wireless",
        "authentication",
        "physical layer",
        "CSI",
        "false acceptance",
        "false rejection",
      ],
    };
  }

  if (/mobility|user movement/.test(text)) {
    return {
      query:
        "wireless channel prediction user mobility channel state information",
      keywords: [
        "wireless",
        "mobility",
        "channel",
        "prediction",
        "CSI",
      ],
    };
  }

  if (/rayleigh|fading|multipath|interference|environment/.test(text)) {
    return {
      query:
        "wireless channel multipath fading interference Rayleigh Rician",
      keywords: [
        "wireless",
        "channel",
        "fading",
        "multipath",
        "interference",
        "Rayleigh",
        "Rician",
      ],
    };
  }

  if (/passive|collection|sensing/.test(text)) {
    return {
      query: "passive wireless CSI collection channel sensing",
      keywords: [
        "passive",
        "wireless",
        "CSI",
        "channel",
        "sensing",
      ],
    };
  }

  if (/prediction|reliability|continuity|CSI/.test(text)) {
    return {
      query:
        "wireless channel state information CSI prediction reliability",
      keywords: [
        "wireless",
        "channel",
        "CSI",
        "prediction",
        "reliability",
      ],
    };
  }

  return {
    query: `${cluster.theme} ${cluster.limitations.join(" ")}`,
    keywords: cluster.theme
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 3),
  };
};

// Weighted lexical relevance scoring.
// Title matches are more important than abstract-only matches.
const calculateRelevance = (paper, keywords) => {
  const title = (paper.title || "").toLowerCase();
  const abstract = (paper.abstract || "").toLowerCase();

  const TITLE_WEIGHT = 3;
  const ABSTRACT_WEIGHT = 1;

  let earnedPoints = 0;
  let maximumPoints = 0;

  const matchedKeywords = [];
  const titleMatches = [];
  const abstractMatches = [];

  for (const keyword of keywords) {
    const normalized = keyword.toLowerCase().trim();

    if (!normalized) continue;

    maximumPoints += TITLE_WEIGHT + ABSTRACT_WEIGHT;

    const foundInTitle = title.includes(normalized);
    const foundInAbstract = abstract.includes(normalized);

    if (foundInTitle) {
      earnedPoints += TITLE_WEIGHT;
      titleMatches.push(keyword);
      matchedKeywords.push(keyword);
    } else if (foundInAbstract) {
      earnedPoints += ABSTRACT_WEIGHT;
      abstractMatches.push(keyword);
      matchedKeywords.push(keyword);
    }
  }

  const relevanceScore =
    maximumPoints === 0
      ? 0
      : Math.round((earnedPoints / maximumPoints) * 100);

  return {
    relevanceScore,
    matchedKeywords,
    titleMatches,
    abstractMatches,
  };
};

export const discoverExternalLiterature = async (workspaceId) => {
  const research = await interpretResearchClusters(workspaceId);

  const results = [];

  for (const cluster of research.interpretations) {
    const profile = getSearchProfile(cluster);

    console.log(
      `Searching cluster ${cluster.clusterId}: ${cluster.theme}`
    );

    console.log("Search query:", profile.query);

    const literature = await searchOpenAlex(profile.query, 10);

    const scoredPapers = literature.papers.map((paper) => {
      const relevance = calculateRelevance(
        paper,
        profile.keywords
      );

      return {
        ...paper,
        ...relevance,
      };
    });

    const relevantPapers = scoredPapers
      .filter((paper) => paper.relevanceScore >= 30)
      .sort((a, b) => {
        // Primary ranking: relevance.
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        // Secondary ranking: title matches.
        if (b.titleMatches.length !== a.titleMatches.length) {
          return b.titleMatches.length - a.titleMatches.length;
        }

        // Final tie-breaker: citation count.
        return b.citedByCount - a.citedByCount;
      });

    results.push({
      clusterId: cluster.clusterId,
      theme: cluster.theme,
      searchQuery: profile.query,
      totalMatchingPapers: literature.totalResults,
      retrievedPapers: scoredPapers.length,
      relevantPapersCount: relevantPapers.length,
      papers: relevantPapers,
    });
  }

    return {
    totalUniquePapers: research.totalUniquePapers,
    totalClusters: research.totalClusters,

    interpretations: research.interpretations,

    totalClustersSearched: results.length,

    totalRetrievedPapers: results.reduce(
      (total, item) => total + item.retrievedPapers,
      0
    ),

    totalRelevantPapers: results.reduce(
      (total, item) => total + item.relevantPapersCount,
      0
    ),

    results,
  };
};
