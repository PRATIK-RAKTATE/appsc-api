import express from "express";
import {
  toggleBookmarkController,
  checkBookmarkController,
  getUserBookmarksController,
} from "../controllers/currentAffairsBookmark.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:currentAffairsId", verifyToken, toggleBookmarkController);
router.get("/:currentAffairsId", verifyToken, checkBookmarkController);
router.get("/", verifyToken, getUserBookmarksController);

export default router;
