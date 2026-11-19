
import { Router } from "express";
import { comparePapers } from "../controllers/compareController.js";

const router = Router({ mergeParams: true });

router.post("/", comparePapers);

export default router;
