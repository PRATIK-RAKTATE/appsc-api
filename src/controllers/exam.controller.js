import { startExamSession, autosaveAnswer } from "../services/exam.service.js";

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
