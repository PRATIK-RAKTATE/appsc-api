import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { KnowledgeChunk } from "../models/knowledgeChunk.model.js";

describe("KnowledgeChunk Model", () => {
  it("should create a valid knowledge chunk", () => {
    const chunk = new KnowledgeChunk({
      bookId: new mongoose.Types.ObjectId(),
      chapterId: new mongoose.Types.ObjectId(),
      blockIds: [new mongoose.Types.ObjectId()],
      content: "This is sample study content.",
      embedding: Array(1536).fill(0.1),
      chunkIndex: 0,
      tokenCount: 500,
      metadata: {
        bookTitle: "Sample Book",
        chapterTitle: "Introduction",
        sourceLanguage: "en",
      },
    });

    const error = chunk.validateSync();

    expect(error).toBeUndefined();
  });

  it("should require bookId", () => {
    const chunk = new KnowledgeChunk({
      chapterId: new mongoose.Types.ObjectId(),
      content: "Sample content",
      embedding: Array(1536).fill(0.1),
      chunkIndex: 0,
      tokenCount: 500,
    });

    const error = chunk.validateSync();

    expect(error?.errors.bookId).toBeDefined();
  });

  it("should require chapterId", () => {
    const chunk = new KnowledgeChunk({
      bookId: new mongoose.Types.ObjectId(),
      content: "Sample content",
      embedding: Array(1536).fill(0.1),
      chunkIndex: 0,
      tokenCount: 500,
    });

    const error = chunk.validateSync();

    expect(error?.errors.chapterId).toBeDefined();
  });

  it("should require content", () => {
    const chunk = new KnowledgeChunk({
      bookId: new mongoose.Types.ObjectId(),
      chapterId: new mongoose.Types.ObjectId(),
      embedding: Array(1536).fill(0.1),
      chunkIndex: 0,
      tokenCount: 500,
    });

    const error = chunk.validateSync();

    expect(error?.errors.content).toBeDefined();
  });

  it("should require embedding", () => {
    const chunk = new KnowledgeChunk({
      bookId: new mongoose.Types.ObjectId(),
      chapterId: new mongoose.Types.ObjectId(),
      content: "Sample content",
      chunkIndex: 0,
      tokenCount: 500,
    });

    const error = chunk.validateSync();

    expect(error?.errors.embedding).toBeDefined();
  });

  it("should reject negative chunkIndex", () => {
    const chunk = new KnowledgeChunk({
      bookId: new mongoose.Types.ObjectId(),
      chapterId: new mongoose.Types.ObjectId(),
      content: "Sample content",
      embedding: Array(1536).fill(0.1),
      chunkIndex: -1,
      tokenCount: 500,
    });

    const error = chunk.validateSync();

    expect(error?.errors.chunkIndex).toBeDefined();
  });

  it("should reject invalid tokenCount", () => {
    const chunk = new KnowledgeChunk({
      bookId: new mongoose.Types.ObjectId(),
      chapterId: new mongoose.Types.ObjectId(),
      content: "Sample content",
      embedding: Array(1536).fill(0.1),
      chunkIndex: 0,
      tokenCount: 0,
    });

    const error = chunk.validateSync();

    expect(error?.errors.tokenCount).toBeDefined();
  });
});