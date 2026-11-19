
import { searchWorkspacePapers } from "../services/searchService.js";

export const searchPapers = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "A search query is required",
      });
    }

    const results = await searchWorkspacePapers({
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
      query: query.trim(),
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
