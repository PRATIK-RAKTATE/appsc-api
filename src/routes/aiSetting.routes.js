import express from "express";

import {
  getAiSettingsController,
  updateAiSettingsController,
} from "../controllers/aiSetting.controller.js";

import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import { auditLog } from "../middleware/audit.middleware.js";

const router = express.Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/", getAiSettingsController);

router.put(
  "/",
  auditLog({ resourceType: "AI_SETTING", action: "UPDATE_AI_SETTINGS" }),
  updateAiSettingsController
);

export default router;
