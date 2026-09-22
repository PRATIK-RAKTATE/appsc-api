import { 
  startExamSession, 
  autosaveAnswer, 
  submitExam, 
  getExamReview, 
  getExamAnalytics,
  getLeaderboard,
} from "../services/exam.service.js";
import { evaluateExamAttempt } from "../services/scoring.service.js";
import { getLeaderboard } from "../services/leaderboard.service.js";

export const startExamController = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.userId;

    const session = await startExamSession(userId, testId);

    return res.status(200).json({
      success: true,
      message: "Exam session started successfully",
      data: session,
    });
  } catch (error) {
    console.error("Start exam error:", error);
    return res.status(error.message.includes("expired") ? 403 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const autosaveAnswerController = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    const result = await autosaveAnswer(attemptId, userId, updates);

    if (result.expired) {
      return res.status(403).json({
        success: false,
        message: "Exam duration has expired. Test cannot be modified.",
        expired: true,
      });
    }

    return res.status(200).json({
      success: true,
      remainingTimeSeconds: result.remainingTimeSeconds,
    });
  } catch (error) {
    console.error("Autosave answer error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const submitExamController = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const scorecard = await evaluateExamAttempt(attemptId, userId);

    return res.status(200).json({
      success: true,
      message: scorecard.idempotent
        ? "Exam already submitted. Returning existing scorecard."
        : "Exam submitted successfully",
      data: scorecard,
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    const status =
      error.message.includes("not found") || error.message.includes("unauthorized")
        ? 404
        : 400;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLeaderboardController = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user?.userId ?? null;
    const page = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "50", 10)));

    const result = await getLeaderboard(testId, { userId, page, limit });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReviewController = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const review = await getExamReview(attemptId, userId);

    return res.status(200).json(review);
  } catch (error) {
    return res.status(error.message.includes("submission") ? 403 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAnalyticsController = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId;

    const analytics = await getExamAnalytics(attemptId, userId);

    return res.status(200).json(analytics);
  } catch (error) {
    return res.status(error.message.includes("submission") ? 403 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/exams/:testId/leaderboard
 * Returns the most recent hourly leaderboard snapshot for a test.
 */
export const getLeaderboardController = async (req, res) => {
  try {
    const { testId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;

    const result = await getLeaderboard(testId, limit);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
