import { CurrentAffairs, RAG_STATUS } from "../models/currentAffairs.model.js";
import { CurrentAffairsChunk } from "../models/currentAffairsChunk.model.js";
import { createSemanticChunks } from "./knowledgeChunk.service.js";
import { generateEmbedding } from "./embedding.service.js";

/**
 * Strips HTML tags and normalizes whitespace from text.
 * @param {string} text
 * @returns {string}
 */
export const cleanTextForRAG = (text) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Processes and ingests a Current Affairs article into the vector database.
 * @param {string|mongoose.Types.ObjectId} currentAffairsId
 * @returns {Promise<Array>} List of generated CurrentAffairsChunk documents
 */
export const ingestCurrentAffairsRAG = async (currentAffairsId) => {
  if (!currentAffairsId) {
    throw new Error("Current affairs ID is required");
  }

  const article = await CurrentAffairs.findById(currentAffairsId).populate(
    "category"
  );

  if (!article) {
    throw new Error("Current affairs article not found");
  }

  try {
    await CurrentAffairs.findByIdAndUpdate(article._id, {
      ragStatus: RAG_STATUS.PROCESSING,
    });

    const cleanedContent = cleanTextForRAG(article.content);
    const cleanedSummary = cleanTextForRAG(article.summary || "");

    const textParts = [article.title];
    if (cleanedSummary) {
      textParts.push(cleanedSummary);
    }
    if (cleanedContent) {
      textParts.push(cleanedContent);
    }

    const fullText = textParts.filter(Boolean).join("\n\n");
    const chunks = createSemanticChunks(fullText);

    if (!chunks.length) {
      await CurrentAffairs.findByIdAndUpdate(article._id, {
        ragStatus: RAG_STATUS.COMPLETED,
        ragIndexedAt: new Date(),
      });
      return [];
    }

    const operations = [];

    for (let index = 0; index < chunks.length; index++) {
      const content = chunks[index];
      const embedding = await generateEmbedding(content);
      const tokenCount = content.split(/\s+/).length;

      const categoryId =
        article.category && typeof article.category === "object"
          ? article.category._id
          : article.category;

      const categorySlug = article.category?.slug || "";
      const categoryName = article.category?.name || "";

      operations.push({
        updateOne: {
          filter: {
            currentAffairsId: article._id,
            chunkIndex: index,
          },
          update: {
            $set: {
              currentAffairsId: article._id,
              categoryId,
              content,
              embedding,
              chunkIndex: index,
              tokenCount,
              metadata: {
                title: article.title,
                categorySlug,
                categoryName,
                tags: article.tags || [],
                publishedAt: article.publishedAt,
              },
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length) {
      await CurrentAffairsChunk.bulkWrite(operations);
    }

    // Clean up any stale chunks if the chunk count is now lower than previously
    await CurrentAffairsChunk.deleteMany({
      currentAffairsId: article._id,
      chunkIndex: { $gte: chunks.length },
    });

    await CurrentAffairs.findByIdAndUpdate(article._id, {
      ragStatus: RAG_STATUS.COMPLETED,
      ragIndexedAt: new Date(),
    });

    return CurrentAffairsChunk.find({
      currentAffairsId: article._id,
    }).sort({
      chunkIndex: 1,
    });
  } catch (error) {
    await CurrentAffairs.findByIdAndUpdate(article._id, {
      ragStatus: RAG_STATUS.FAILED,
    });

    throw error;
  }
};
