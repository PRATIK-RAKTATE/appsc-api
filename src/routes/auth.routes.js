import express from "express";

import {
  sendOTP,
  verifyOTPController,
  refreshTokenController,
  getCurrentUser,
} from "../controllers/auth.controller.js";

import { verifyToken, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/send-otp", sendOTP);

router.post("/verify-otp", verifyOTPController);

router.post("/refresh-token", refreshTokenController);

router.get(
  "/me",
  verifyToken,
  requireRole("STUDENT", "MENTOR", "ADMIN"),
  getCurrentUser,
);

export default router;
