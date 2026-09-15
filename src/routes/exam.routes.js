import express from "express";
import { 
  startExamController, 
  autosaveAnswerController, 
  submitExamController, 
  getReviewController, 
  getAnalyticsController 
} from "../controllers/exam.controller.js";
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

router.post(
  "/attempts/:attemptId/submit",
  verifyToken,
  submitExamController
);

router.get(
  "/attempts/:attemptId/review",
  verifyToken,
  getReviewController
);

router.get(
  "/attempts/:attemptId/analytics",
  verifyToken,
  getAnalyticsController
);

export default router;
