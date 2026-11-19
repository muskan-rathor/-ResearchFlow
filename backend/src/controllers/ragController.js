
import { answerResearchQuestion } from "../services/ragService.js";

export const askQuestion = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (
      !question ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A question is required",
      });
    }

    const result = await answerResearchQuestion({
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
      question: question.trim(),
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
