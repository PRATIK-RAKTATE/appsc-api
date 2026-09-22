import { retrieveSimilarChunks } from "../services/vectorRetrieval.service.js";

/**
 * POST /api/ai/vector-search
 *
 * Internal / diagnostic endpoint. Protected by ADMIN or SUPER_ADMIN role.
 *
 * Request body:
 *   {
 *     "query":   string   (required)
 *     "limit":   number   (optional, default 5, max 20)
 *     "minScore": number  (optional, default 0.70)
 *     "filters": object   (optional, e.g. { bookId, subject, language })
 *   }
 *
 * Success response (200):
 *   {
 *     "success": true,
 *     "count": number,
 *     "executionTimeMs": number,
 *     "data": [ { chunkId, content, title, score, metadata } ]
 *   }
 */
export const vectorSearchController = async (req, res) => {
  const startTime = Date.now();

  try {
    const { query, limit, minScore, filters } = req.body;

    // --- Validate required query field ---
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "query is required and must be a non-empty string",
      });
    }

    // --- Validate optional numeric fields ---
    if (limit !== undefined && (typeof limit !== "number" || !Number.isFinite(limit) || limit < 1)) {
      return res.status(400).json({
        success: false,
        message: "limit must be a positive finite number",
      });
    }

    if (
      minScore !== undefined &&
      (typeof minScore !== "number" || !Number.isFinite(minScore) || minScore < 0 || minScore > 1)
    ) {
      return res.status(400).json({
        success: false,
        message: "minScore must be a number between 0 and 1",
      });
    }

    if (filters !== undefined && (typeof filters !== "object" || Array.isArray(filters))) {
      return res.status(400).json({
        success: false,
        message: "filters must be a plain object",
      });
    }

    const results = await retrieveSimilarChunks({
      query: query.trim(),
      limit,
      minScore,
      filters,
    });

    const executionTimeMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      count: results.length,
      executionTimeMs,
      data: results,
    });
  } catch (error) {
    console.error("[vectorSearch] Error:", error.message);

    const executionTimeMs = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      message: error.message || "Vector search failed",
      executionTimeMs,
    });
  }
};
