import express from "express";
import {
  createCurrentAffairsController,
  publishCurrentAffairsController,
  getCurrentAffairsByIdController,
  getCurrentAffairsController,
  updateCurrentAffairsController,
  deleteCurrentAffairsController,
} from "../controllers/currentAffairs.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getCurrentAffairsController);
router.get("/:id", getCurrentAffairsByIdController);
router.post("/", verifyToken, createCurrentAffairsController);
router.post("/:id/publish", verifyToken, publishCurrentAffairsController);
router.put("/:id", verifyToken, updateCurrentAffairsController);
router.delete("/:id", verifyToken, deleteCurrentAffairsController);

export default router;
