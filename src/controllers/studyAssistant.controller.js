import { getRemainingQuota } from "../services/aiQuota.service.js";
import { queryStudyAssistant } from "../services/ragStudyAssistant.service.js";

/**
 * POST /api/ai/assistant
 *
 * This controller receives control only after checkAiQuotaAndGuardrails
 * has validated the prompt and consumed one quota credit.
 *
 * req.aiQuota is populated by the middleware.
 */
export const studyAssistantController = async (req, res) => {
  try {
    const { query } = req.body;
    const result = await queryStudyAssistant({
      query,
      userId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      data: {
        query,
        ...result,
        remainingQuota: req.aiQuota.remaining,
        quotaLimit: req.aiQuota.limit,
        resetsAt: req.aiQuota.resetsAt,
      },
    });
  } catch (error) {
    console.error("[studyAssistant] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

/**
 * GET /api/ai/assistant/quota
 *
 * Returns the authenticated user's current daily query quota status
 * without consuming a credit.
 */
export const getQuotaStatusController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = await getRemainingQuota(userId);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("[getQuotaStatus] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve quota status.",
    });
  }
};
