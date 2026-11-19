
import { Router } from "express";

import { uploadPaper } from "../middleware/upload.middleware.js";

import {
  uploadPaper as uploadPaperController,
  getPapers,
} from "../controllers/paperController.js";
import { searchPapers } from "../controllers/searchController.js";


const router = Router({ mergeParams: true });

router.post("/", uploadPaper, uploadPaperController);
router.get("/", getPapers);
router.post("/search", searchPapers);

export default router;
