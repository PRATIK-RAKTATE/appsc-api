import { BookBlock } from "../models/bookBlock.model.js";
import { KnowledgeChunk } from "../models/knowledgeChunk.model.js";
import { Chapter } from "../models/chapter.model.js";
import { generateEmbedding } from "./embedding.service.js";

const MIN_TOKENS = 500;
const MAX_TOKENS = 1000;
const OVERLAP_TOKENS = 100;

const tokenize = (text) => text.trim().split(/\s+/);

export const createSemanticChunks = (text) => {
  if (!text || typeof text !== "string") {
    return [];
  }

  const tokens = tokenize(text);

  if (tokens.length <= MAX_TOKENS) {
    return [tokens.join(" ")];
  }

  const chunks = [];
  let start = 0;

  while (start < tokens.length) {
    const remaining = tokens.length - start;

    if (remaining <= MAX_TOKENS) {
      chunks.push(tokens.slice(start).join(" "));
      break;
    }

    const end = start + MAX_TOKENS;
    chunks.push(tokens.slice(start, end).join(" "));

    start = end - OVERLAP_TOKENS;

    // Avoid creating a final chunk smaller than 500 tokens.
    if (tokens.length - start < MIN_TOKENS) {
      const finalStart = Math.max(tokens.length - MIN_TOKENS, start);

      if (finalStart > start) {
        chunks.push(tokens.slice(finalStart).join(" "));
      }

      break;
    }
  }

  return chunks;
};

export const createKnowledgeChunks = async (chapterId) => {
  if (!chapterId) {
    throw new Error("Chapter ID is required");
  }

  const chapter = await Chapter.findById(chapterId);

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  const blocks = await BookBlock.find({ chapterId }).sort({
    blockNumber: 1,
  });

  if (!blocks.length) {
    return [];
  }

  const fullText = blocks
    .map((block) => block.englishText)
    .join("\n");

  const chunks = createSemanticChunks(fullText);

  const knowledgeChunks = [];

  for (let index = 0; index < chunks.length; index++) {
    const content = chunks[index];

    const embedding = await generateEmbedding(content);

    const tokenCount = content.split(/\s+/).length;

    const knowledgeChunk = await KnowledgeChunk.create({
      bookId: chapter.bookId,
      chapterId: chapter._id,
      blockIds: blocks.map((block) => block._id),
      content,
      embedding,
      chunkIndex: index,
      tokenCount,
      metadata: {
        chapterTitle: chapter.title,
      },
    });

    knowledgeChunks.push(knowledgeChunk);
  }

  return knowledgeChunks;
};