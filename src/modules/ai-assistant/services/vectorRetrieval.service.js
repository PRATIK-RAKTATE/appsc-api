import mongoose from "mongoose";
import { ContentChunk } from "../models/contentChunk.model.js";
import {
  generateQueryEmbedding,
  EMBEDDING_DIMENSIONS,
} from "./embedding.service.js";

const VECTOR_INDEX_NAME =
  process.env.MONGODB_VECTOR_INDEX_NAME || "vector_index";

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_SCORE = 0.7;

/**
 * Build a MongoDB Atlas $vectorSearch filter stage from caller-supplied filter options.
 *
 * Supported filter keys: bookId, subject (maps to metadata.subject), language
 * (maps to metadata.language).
 *
 * @param {object} [filters]
 * @returns {object|null} MQL filter expression compatible with Atlas vector search filter
 */
const buildFilterStage = (filters) => {
  if (!filters || typeof filters !== "object") return null;

  const conditions = [];

  if (filters.bookId) {
    const id =
      filters.bookId instanceof mongoose.Types.ObjectId
        ? filters.bookId
        : mongoose.Types.ObjectId.isValid(filters.bookId)
          ? new mongoose.Types.ObjectId(filters.bookId)
          : null;
    if (id) {
      conditions.push({ bookId: { $eq: id } });
    }
  }

  if (filters.subject && typeof filters.subject === "string") {
    conditions.push({ "metadata.subject": { $eq: filters.subject.trim() } });
  }

  if (filters.language && typeof filters.language === "string") {
    const lang = filters.language.toUpperCase();
    if (["EN", "TE"].includes(lang)) {
      conditions.push({ "metadata.language": { $eq: lang } });
    }
  }

  if (conditions.length === 0) return null;
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
};

/**
 * Retrieve similar content chunks from MongoDB Atlas using $vectorSearch.
 *
 * @param {object} options
 * @param {string}  options.query       - Natural language search query.
 * @param {number}  [options.limit=5]   - Maximum number of results (capped at 20).
 * @param {number}  [options.minScore=0.70] - Minimum cosine similarity score threshold.
 * @param {object}  [options.filters]   - Optional pre-filter: { bookId, subject, language }.
 *
 * @returns {Promise<Array<{chunkId: string, content: string, title: string, score: number, metadata: object}>>}
 */
export const retrieveSimilarChunks = async ({
  query,
  limit = DEFAULT_LIMIT,
  minScore = DEFAULT_MIN_SCORE,
  filters,
} = {}) => {
  // --- Input validation ---
  if (!query || typeof query !== "string" || !query.trim()) {
    throw new Error("Query string is required for vector search");
  }

  const safeLimit = Math.min(
    Math.max(1, Number.isFinite(limit) ? Math.floor(limit) : DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const safeMinScore =
    Number.isFinite(minScore) && minScore >= 0 && minScore <= 1
      ? minScore
      : DEFAULT_MIN_SCORE;

  // --- Step 1: Generate query embedding ---
  let queryVector;
  try {
    queryVector = await generateQueryEmbedding(query.trim());
  } catch (err) {
    console.error("[vectorRetrieval] Embedding generation failed:", err.message);
    throw new Error(`Failed to generate query embedding: ${err.message}`);
  }

  // Sanity check: dimensions must match the indexed dimension exactly
  if (queryVector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Query vector dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${queryVector.length}`
    );
  }

  // --- Step 2: Build optional filter ---
  const filterStage = buildFilterStage(filters);

  // --- Step 3: Build $vectorSearch aggregation pipeline ---
  const pipeline = [
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(safeLimit * 15, 100),
        limit: safeLimit,
        ...(filterStage ? { filter: filterStage } : {}),
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        title: 1,
        bookId: 1,
        metadata: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
    {
      $match: {
        score: { $gte: safeMinScore },
      },
    },
  ];

  // --- Step 4: Execute aggregation ---
  let rawResults;
  try {
    rawResults = await ContentChunk.aggregate(pipeline);
  } catch (err) {
    console.error("[vectorRetrieval] Aggregation failed:", err.message);
    throw new Error(`Vector search aggregation failed: ${err.message}`);
  }

  // --- Step 5: Format and return results ---
  return rawResults.map((doc) => ({
    chunkId: doc._id.toString(),
    content: doc.content,
    title: doc.title,
    score: doc.score,
    metadata: doc.metadata ?? {},
  }));
};
