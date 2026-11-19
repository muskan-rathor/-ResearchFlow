
import { Router } from "express";
import { createWorkspace, getWorkspaces,getWorkspaceById,
  updateWorkspace,
  deleteWorkspace, } from "../controllers/workspaceController.js";

const router = Router();

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspaceById);
router.put("/:id", updateWorkspace);
router.delete("/:id", deleteWorkspace);

export default router;
