import express from "express";
import {
  createCurrentAffairsController,
  getCurrentAffairsController,
  getCurrentAffairsByIdController,
  updateCurrentAffairsController,
  updateCurrentAffairStatusController,
  deleteCurrentAffairsController,
} from "../controllers/currentAffairs.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken, requireRole("ADMIN"));

router.post("/", createCurrentAffairsController);
router.get("/", getCurrentAffairsController);
router.get("/:id", getCurrentAffairsByIdController);
router.put("/:id", updateCurrentAffairsController);
router.patch("/:id/status", updateCurrentAffairStatusController);
router.delete("/:id", deleteCurrentAffairsController);

export default router;
