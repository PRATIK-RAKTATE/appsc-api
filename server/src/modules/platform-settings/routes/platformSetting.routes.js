import express from "express";

import {
  getAllPlatformSettingsController,
  getPlatformSettingController,
  updatePlatformSettingController,
  updatePlatformSettingsController,
} from "../controllers/platformSetting.controller.js";

import {
  verifyToken,
  requireRole,
} from "../../auth/index.js";

import { auditLog } from "../../../shared/middleware/audit.middleware.js";

const router = express.Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/", getAllPlatformSettingsController);

router.patch(
  "/",
  auditLog({ resourceType: "PLATFORM_SETTING", action: "UPDATE_PLATFORM_SETTINGS" }),
  updatePlatformSettingsController
);

router.get("/:key", getPlatformSettingController);

router.patch(
  "/:key",
  auditLog({ resourceType: "PLATFORM_SETTING", action: "UPDATE_PLATFORM_SETTING" }),
  async (req, res) => {
    req.body.key = req.params.key;

    return updatePlatformSettingController(req, res);
  }
);

export default router;