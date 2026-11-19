
import { Router } from "express";
import { askQuestion } from "../controllers/ragController.js";

const router = Router({ mergeParams: true });

router.post("/", askQuestion);

export default router;
