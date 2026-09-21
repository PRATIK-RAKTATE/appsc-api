import { CurrentAffairs, RAG_STATUS } from "../models/currentAffairs.model.js";
import { CurrentAffairsChunk } from "../models/currentAffairsChunk.model.js";
import { KnowledgeChunk } from "../models/knowledgeChunk.model.js";

/**
 * Atlas vector search index name for the KnowledgeChunk collection.
 * Must match the index configured in MongoDB Atlas for that collection.
 */
const KNOWLEDGE_CHUNK_INDEX_NAME =
  process.env.MONGODB_KNOWLEDGE_CHUNK_INDEX_NAME || "knowledge_chunk_vector_index";

const DEFAULT_MIN_SCORE = 0.75;
const PER_CHUNK_LIMIT = 10;
const TOP_CHAPTERS = 3;

/**
 * Run a single $vectorSearch against KnowledgeChunk using the given embedding vector.
 *
 * @param {number[]} queryVector  - Embedding vector from a CurrentAffairsChunk.
 * @param {number}   limit        - Max raw candidates to return per search.
 * @param {number}   minScore     - Minimum cosine similarity threshold.
 * @returns {Promise<Array<{chapterId: string, score: number}>>}
 */
const searchKnowledgeChunksByEmbedding = async (
  queryVector,
  limit = PER_CHUNK_LIMIT,
  minScore = DEFAULT_MIN_SCORE
) => {
  const pipeline = [
    {
      $vectorSearch: {
        index: KNOWLEDGE_CHUNK_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: Math.max(limit * 15, 100),
        limit,
      },
    },
    {
      $project: {
        _id: 1,
        chapterId: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
    {
      $match: {
        score: { $gte: minScore },
      },
    },
  ];

  const results = await KnowledgeChunk.aggregate(pipeline);

  return results.map((doc) => ({
    chapterId: doc.chapterId.toString(),
    score: doc.score,
  }));
};

/**
 * For a given CurrentAffairs article, find the top related syllabus chapters by
 * running a per-chunk $vectorSearch against KnowledgeChunk and aggregating results.
 *
 * Algorithm:
 *  1. Fetch all CurrentAffairsChunk documents for the article.
 *  2. For each chunk's embedding, run a separate $vectorSearch against KnowledgeChunk.
 *  3. Merge all per-chunk results; deduplicate by chapterId keeping the highest score.
 *  4. Sort descending by score, take the top N unique chapters.
 *  5. Persist the result to CurrentAffairs.relatedChapters and update semanticLinkStatus.
 *
 * @param {string} currentAffairsId - ObjectId string of the article to process.
 * @param {object} [options]
 * @param {number} [options.minScore=0.75]   - Minimum cosine similarity score.
 * @param {number} [options.topChapters=3]   - Maximum related chapters to store.
 * @param {number} [options.perChunkLimit=10] - Max raw hits per chunk search.
 * @returns {Promise<Array<{chapterId: string, score: number}>>}  The saved relatedChapters.
 */
export const linkCurrentAffairsToChapters = async (
  currentAffairsId,
  {
    minScore = DEFAULT_MIN_SCORE,
    topChapters = TOP_CHAPTERS,
    perChunkLimit = PER_CHUNK_LIMIT,
  } = {}
) => {
  if (!currentAffairsId) {
    throw new Error("currentAffairsId is required");
  }

  const article = await CurrentAffairs.findById(currentAffairsId);
  if (!article) {
    throw new Error(`CurrentAffairs not found: ${currentAffairsId}`);
  }

  try {
    // Mark as processing
    await CurrentAffairs.findByIdAndUpdate(currentAffairsId, {
      semanticLinkStatus: RAG_STATUS.PROCESSING,
    });

    // Step 1: Fetch all chunks for this article
    const chunks = await CurrentAffairsChunk.find(
      { currentAffairsId },
      { embedding: 1, chunkIndex: 1 }
    ).sort({ chunkIndex: 1 });

    if (!chunks.length) {
      // No chunks yet — RAG ingestion hasn't run. Store empty and mark completed.
      await CurrentAffairs.findByIdAndUpdate(currentAffairsId, {
        relatedChapters: [],
        semanticLinkStatus: RAG_STATUS.COMPLETED,
        semanticLinkIndexedAt: new Date(),
      });
      return [];
    }

    // Step 2 & 3: Per-chunk vector search and merge results
    // Use a Map to deduplicate by chapterId, keeping the highest score seen.
    const bestScoreByChapter = new Map();

    for (const chunk of chunks) {
      if (!chunk.embedding || !chunk.embedding.length) {
        continue;
      }

      const hits = await searchKnowledgeChunksByEmbedding(
        chunk.embedding,
        perChunkLimit,
        minScore
      );

      for (const { chapterId, score } of hits) {
        const existing = bestScoreByChapter.get(chapterId);
        if (existing === undefined || score > existing) {
          bestScoreByChapter.set(chapterId, score);
        }
      }
    }

    // Step 4: Sort by score descending, take top N
    const relatedChapters = Array.from(bestScoreByChapter.entries())
      .map(([chapterId, score]) => ({ chapterId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topChapters)
      .map(({ chapterId, score }) => ({
        chapterId,
        // Round to 4 decimal places for clean storage
        score: Math.round(score * 10000) / 10000,
      }));

    // Step 5: Persist
    await CurrentAffairs.findByIdAndUpdate(currentAffairsId, {
      relatedChapters,
      semanticLinkStatus: RAG_STATUS.COMPLETED,
      semanticLinkIndexedAt: new Date(),
    });

    return relatedChapters;
  } catch (error) {
    await CurrentAffairs.findByIdAndUpdate(currentAffairsId, {
      semanticLinkStatus: RAG_STATUS.FAILED,
    });

    throw error;
  }
};
