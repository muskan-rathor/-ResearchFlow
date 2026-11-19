
import { Router } from "express";

import {
  analyzeResearchGaps,
  clusterResearchGaps,
  getResearchGapRecurrence,
  interpretResearchGaps,
  generateAndSaveResearchGapReport,
  listResearchGapReports,
  getSavedResearchGapReport,
} from "../controllers/researchGapController.js";

const router = Router({ mergeParams: true });

router.post("/analyze", analyzeResearchGaps);
router.post("/cluster", clusterResearchGaps);
router.get("/recurrence", getResearchGapRecurrence);
router.post("/interpret", interpretResearchGaps);

// Report persistence
router.post("/reports/generate", generateAndSaveResearchGapReport);
router.get("/reports", listResearchGapReports);
router.get("/reports/:reportId", getSavedResearchGapReport);

export default router;
