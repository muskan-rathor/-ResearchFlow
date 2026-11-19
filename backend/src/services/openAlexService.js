
const OPENALEX_BASE_URL = "https://api.openalex.org/works";

const reconstructAbstract = (invertedIndex) => {
  if (!invertedIndex) return null;

  const words = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) {
      words[position] = word;
    }
  }

  return words.filter(Boolean).join(" ");
};

export const searchOpenAlex = async (searchQuery, perPage = 5) => {
  const apiKey = process.env.OPENALEX_API_KEY;

  if (!apiKey) {
    throw new Error("OPENALEX_API_KEY is missing from backend/.env");
  }

  if (!searchQuery || !searchQuery.trim()) {
    throw new Error("A search query is required");
  }

  const url = new URL(OPENALEX_BASE_URL);

  url.searchParams.set("search", searchQuery.trim());
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set(
    "select",
    "id,doi,title,publication_year,cited_by_count,authorships,abstract_inverted_index,primary_location"
  );
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    if (response.status === 429) {
      throw new Error("OpenAlex rate limit reached. Try again later.");
    }

    throw new Error(
      `OpenAlex request failed (${response.status}): ${errorBody.slice(0, 500)}`
    );
  }

  const data = await response.json();

  return {
    totalResults: data.meta?.count ?? 0,

    papers: (data.results ?? []).map((paper) => ({
      openAlexId: paper.id,
      doi: paper.doi,
      title: paper.title,
      publicationYear: paper.publication_year,
      citedByCount: paper.cited_by_count ?? 0,

      authors: (paper.authorships ?? [])
        .map((item) => item.author?.display_name)
        .filter(Boolean),

      abstract: reconstructAbstract(
        paper.abstract_inverted_index
      ),

      paperUrl: paper.primary_location?.landing_page_url ?? paper.doi,
    })),
  };
};
