
import { analyzeWorkspacePapers } from "../services/paperAnalysisService.js";
import { clusterWorkspaceLimitations } from "../services/limitationClusteringService.js";
import { calculateClusterRecurrence } from "../services/recurrenceService.js";
import { interpretResearchClusters } from "../services/clusterInterpretationService.js";
import { getWorkspaceById } from "../repositories/workspaceRepository.js";

import {
  saveResearchGapReport,
  getReportsByWorkspace,
  getResearchGapReportById,
} from "../repositories/researchGapRepository.js";

import { discoverExternalLiterature } from "../services/externalLiteratureService.js";

export const analyzeResearchGaps = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const result = await analyzeWorkspacePapers(
      workspaceId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "Research papers analyzed successfully",
      data: result
    });

  } catch (error) {
    next(error);
  }
};


export const clusterResearchGaps = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await clusterWorkspaceLimitations(workspaceId);

    res.status(200).json({
      success: true,
      message: "Research limitations clustered successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getResearchGapRecurrence = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await calculateClusterRecurrence(workspaceId);

    res.status(200).json({
      success: true,
      message: "Research gap recurrence calculated successfully",
      data: result
    });
  } catch (error) {
  console.error("Report generation failed:", error);
  next(error);
}
};

export const interpretResearchGaps = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const result = await interpretResearchClusters(workspaceId);

    res.status(200).json({
      success: true,
      message: "Research clusters interpreted successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};


export const generateAndSaveResearchGapReport = async (
  req,
  res,
  next
) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const requestedFocus = req.body?.focus;

const focus =
  typeof requestedFocus === "string" && requestedFocus.trim()
    ? requestedFocus.trim()
    : "Research Gap Analysis";

    // Verify workspace ownership before running AI processing.
    const workspace = await getWorkspaceById(
      workspaceId,
      userId
    );

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // Generate interpretations and external literature.
    const report = await discoverExternalLiterature(workspaceId);

    // Persist complete report and external papers.
    const savedReport = await saveResearchGapReport(
      workspaceId,
      focus,
      report
    );

    return res.status(201).json({
      success: true,
      message: "Research gap report generated and saved",
      data: savedReport,
    });
  } catch (error) {
  console.error("========== REPORT GENERATION ERROR ==========");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  console.error("==============================================");

  next(error);
}
};


export const listResearchGapReports = async (
  req,
  res,
  next
) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    const workspace = await getWorkspaceById(
      workspaceId,
      userId
    );

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const reports = await getReportsByWorkspace(workspaceId);

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};


export const getSavedResearchGapReport = async (
  req,
  res,
  next
) => {
  try {
    const { workspaceId, reportId } = req.params;
    const userId = req.user.id;

    const workspace = await getWorkspaceById(
      workspaceId,
      userId
    );

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const report = await getResearchGapReportById(
      reportId,
      workspaceId
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Research gap report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
