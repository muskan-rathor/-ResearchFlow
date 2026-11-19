
import { compareResearchPapers } from "../services/compareService.js";

export const comparePapers = async (req, res, next) => {
  try {
    const { paperIds } = req.body;

    if (
      !Array.isArray(paperIds) ||
      paperIds.length !== 2 ||
      paperIds.some((id) => typeof id !== "string") ||
      new Set(paperIds).size !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Exactly two different paper IDs are required",
      });
    }

    const result = await compareResearchPapers({
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
      paperIds,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
