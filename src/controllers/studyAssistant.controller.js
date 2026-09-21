import { getRemainingQuota } from "../services/aiQuota.service.js";

/**
 * POST /api/ai/assistant
 *
 * Placeholder study-assistant handler.
 * The full RAG + OpenRouter pipeline is implemented in TASK-05.3.1.
 * This controller receives control only after checkAiQuotaAndGuardrails
 * middleware has already validated the prompt and consumed one quota credit.
 *
 * req.aiQuota is populated by the middleware.
 */
export const studyAssistantController = async (req, res) => {
  try {
    const { query } = req.body;
    const { remaining, limit, resetsAt } = req.aiQuota;

    // The actual RAG/LLM pipeline would be invoked here.
    // For this ticket scope we echo the query back so the middleware tests
    // can verify end-to-end plumbing without a live OpenRouter key.
    return res.status(200).json({
      success: true,
      data: {
        query,
        answer: null, // populated by ragStudyAssistant.service in TASK-05.3.1
        source: null,
        references: [],
        remainingQuota: remaining,
        quotaLimit: limit,
        resetsAt,
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
