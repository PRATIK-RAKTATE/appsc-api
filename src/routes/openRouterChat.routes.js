import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { ragChatStreamController } from "../controllers/openRouterChat.controller.js";

const router = express.Router();

/**
 * POST /api/ai/chat/stream
 *
 * Stream a RAG chat response from OpenRouter with book/page citations.
 *
 * Access: Any authenticated user.
 *
 * Body: { query: string, limit?: number, minScore?: number, filters?: object }
 * Stream events:
 *   { type: "citations", data: [...] }
 *   { type: "token", content: "..." }
 *   { type: "done" }
 *   { type: "error", message: "..." }
 */
router.post("/chat/stream", verifyToken, ragChatStreamController);

export default router;
