import express from "express";

import {
  getAiSettingsController,
  updateAiSettingsController,
} from "../controllers/aiSetting.controller.js";

import { verifyToken, requireRole } from "../../auth/index.js";
import { auditLog } from "../../../shared/middleware/audit.middleware.js";

const router = express.Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/", getAiSettingsController);

router.put(
  "/",
  auditLog({ resourceType: "AI_SETTING", action: "UPDATE_AI_SETTINGS" }),
  updateAiSettingsController
);

export default router;
