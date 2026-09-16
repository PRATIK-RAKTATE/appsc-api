import express from "express";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import { vectorSearchController } from "../controllers/vectorSearch.controller.js";

const router = express.Router();

/**
 * POST /api/ai/vector-search
 *
 * Internal diagnostic endpoint that executes a MongoDB Atlas $vectorSearch
 * and returns the most relevant ContentChunks for the given query.
 *
 * Access: ADMIN or SUPER_ADMIN only.
 *
 * Body: { query: string, limit?: number, minScore?: number, filters?: object }
 */
router.post(
  "/vector-search",
  verifyToken,
  requireRole("ADMIN", "SUPER_ADMIN"),
  vectorSearchController
);

export default router;
