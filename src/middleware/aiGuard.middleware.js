import { validateAcademicPrompt } from "../utils/academicGuardrail.js";
import { checkAndConsumeQuota } from "../services/aiQuota.service.js";

/**
 * checkAiQuotaAndGuardrails
 *
 * Express middleware that must run before the AI assistant handler.
 * It performs two sequential checks:
 *
 *   1. Academic guardrail — validates `req.body.query` against the prompt filter.
 *      Rejects with 400 { code: 'GUARDRAIL_VIOLATION' } on failure.
 *
 *   2. Daily quota — checks and atomically increments the user's daily usage.
 *      Rejects with 429 { code: 'QUOTA_EXHAUSTED' } when the limit is reached.
 *
 * On success, attaches `req.aiQuota` with the remaining quota details so the
 * downstream controller can include them in the response without a second DB hit.
 *
 * @type {import("express").RequestHandler}
 */
export const checkAiQuotaAndGuardrails = async (req, res, next) => {
  const { query } = req.body ?? {};
  const userId = req.user?.userId;

  // --- 1. Guardrail check ---
  const guardResult = validateAcademicPrompt(query);

  if (!guardResult.isValid) {
    return res.status(400).json({
      success: false,
      message: guardResult.reason,
      code: "GUARDRAIL_VIOLATION",
    });
  }

  // --- 2. Quota check ---
  const quotaResult = await checkAndConsumeQuota(userId);

  if (!quotaResult.allowed) {
    return res.status(429).json({
      success: false,
      message: "Daily AI query limit reached. Please try again tomorrow.",
      code: "QUOTA_EXHAUSTED",
      limit: quotaResult.limit,
      resetsAt: quotaResult.resetsAt,
    });
  }

  // Attach quota state for downstream use
  req.aiQuota = {
    remaining: quotaResult.remaining,
    limit: quotaResult.limit,
    resetsAt: quotaResult.resetsAt,
  };

  next();
};
