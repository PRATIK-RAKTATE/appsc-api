import express from "express";
import { startExamController, autosaveAnswerController } from "../controllers/exam.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/:testId/start",
  verifyToken,
  startExamController
);

router.patch(
  "/attempts/:attemptId/autosave",
  verifyToken,
  autosaveAnswerController
);

export default router;
