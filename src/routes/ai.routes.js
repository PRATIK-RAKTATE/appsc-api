import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import { vectorSearchController } from "../controllers/vectorSearch.controller.js";
import {
  studyAssistantController,
  getQuotaStatusController,
} from "../controllers/studyAssistant.controller.js";
import { checkAiQuotaAndGuardrails } from "../middleware/aiGuard.middleware.js";

const router = express.Router();

/**
 * POST /api/ai/vector-search
 *
 * Internal diagnostic endpoint. Executes a MongoDB Atlas $vectorSearch and
 * returns the most relevant ContentChunks for the given query.
 *
 * Access: ADMIN or SUPER_ADMIN only.
 * Body: { query, limit?, minScore?, filters? }
 */
router.post(
  "/vector-search",
  verifyToken,
  requireRole("ADMIN", "SUPER_ADMIN"),
  vectorSearchController
);

/**
 * POST /api/ai/assistant
 *
 * Smart AI Study Assistant for authenticated students.
 *
 * Middleware chain:
 *   1. verifyToken              — authenticate the request
 *   2. checkAiQuotaAndGuardrails — validate prompt + enforce daily quota
 *   3. studyAssistantController — RAG pipeline handler
 *
 * Returns 400 on guardrail violations, 429 on quota exhaustion, 200 on success.
 * Body: { query: string }
 */
router.post(
  "/assistant",
  verifyToken,
  checkAiQuotaAndGuardrails,
  studyAssistantController
);

/**
 * GET /api/ai/assistant/quota
 *
 * Returns the authenticated user's current daily query quota status
 * without consuming a credit.
 *
 * Access: Any authenticated user.
 */
router.get(
  "/assistant/quota",
  verifyToken,
  getQuotaStatusController
);

export default router;
