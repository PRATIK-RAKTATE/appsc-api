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
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken, requireRole("ADMIN"));

router.get("/", getAllPlatformSettingsController);

router.patch("/", updatePlatformSettingsController);

router.get("/:key", getPlatformSettingController);

router.patch("/:key", async (req, res) => {
  req.body.key = req.params.key;

  return updatePlatformSettingController(req, res);
});

export default router;