
import * as paperService from "../services/paperService.js";

export const uploadPaper = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    const paper = await paperService.createPaper({
      workspaceId: req.params.workspaceId,
      userId: req.user.id,
      title: req.body.title,
      file: req.file,
    });

    res.status(201).json({
      success: true,
      message: "Paper uploaded successfully",
      data: paper,
    });
  } catch (error) {
    next(error);
  }
};


export const getPapers = async (req, res, next) => {
  try {
    const papers = await paperService.getPapersByWorkspace(
      req.params.workspaceId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      count: papers.length,
      data: papers,
    });
  } catch (error) {
    next(error);
  }
};
