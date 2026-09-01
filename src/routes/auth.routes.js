import express from "express";
import { sendOTP , verifyOTPController, refreshTokenController,  } from "../controllers/auth.controller.js";


const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTPController);
router.post("/refresh-token", refreshTokenController);

export default router;