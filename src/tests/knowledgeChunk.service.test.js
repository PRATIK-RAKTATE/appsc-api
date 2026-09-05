import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockChapterFindById,
  mockBookBlockFind,
  mockKnowledgeChunkCreate,
  mockGenerateEmbedding,
} = vi.hoisted(() => ({
  mockChapterFindById: vi.fn(),
  mockBookBlockFind: vi.fn(),
  mockKnowledgeChunkCreate: vi.fn(),
  mockGenerateEmbedding: vi.fn(),
}));

vi.mock("../models/chapter.model.js", () => ({
  Chapter: {
    findById: mockChapterFindById,
  },
}));

vi.mock("../models/bookBlock.model.js", () => ({
  BookBlock: {
    find: mockBookBlockFind,
  },
}));

vi.mock("../models/knowledgeChunk.model.js", () => ({
  KnowledgeChunk: {
    create: mockKnowledgeChunkCreate,
  },
}));

vi.mock("../services/embedding.service.js", () => ({
  generateEmbedding: mockGenerateEmbedding,
}));

import {
  createSemanticChunks,
  createKnowledgeChunks,
} from "../services/knowledgeChunk.service.js";

describe("Knowledge Chunk Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array for empty text", () => {
    expect(createSemanticChunks("")).toEqual([]);
  });

  it("should return empty array for invalid input", () => {
    expect(createSemanticChunks(null)).toEqual([]);
    expect(createSemanticChunks(undefined)).toEqual([]);
  });

  it("should create chunks with maximum 1000 tokens", () => {
    const text = Array(2000).fill("word").join(" ");

    const chunks = createSemanticChunks(text);

    expect(chunks.length).toBeGreaterThan(1);

    chunks.forEach((chunk) => {
      const tokenCount = chunk.split(/\s+/).length;
      expect(tokenCount).toBeLessThanOrEqual(1000);
    });
  });

  it("should create chunks with at least 500 tokens", () => {
    const text = Array(2000).fill("word").join(" ");

    const chunks = createSemanticChunks(text);

    chunks.forEach((chunk) => {
      const tokenCount = chunk.split(/\s+/).length;
      expect(tokenCount).toBeGreaterThanOrEqual(500);
    });
  });

  it("should use 100 token overlap between chunks", () => {
    const text = Array.from(
      { length: 2000 },
      (_, index) => `word${index}`
    ).join(" ");

    const chunks = createSemanticChunks(text);

    expect(chunks.length).toBeGreaterThan(1);

    const firstTokens = chunks[0].split(/\s+/);
    const secondTokens = chunks[1].split(/\s+/);

    expect(secondTokens.slice(0, 100)).toEqual(
      firstTokens.slice(-100)
    );
  });

  it("should preserve the original text content", () => {
    const text = Array(600).fill("study").join(" ");

    const chunks = createSemanticChunks(text);

    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(text);
  });

  it("should reject when chapter ID is missing", async () => {
    await expect(createKnowledgeChunks()).rejects.toThrow(
      "Chapter ID is required"
    );
  });

  it("should reject when chapter is not found", async () => {
    mockChapterFindById.mockResolvedValue(null);

    await expect(
      createKnowledgeChunks("chapter-id")
    ).rejects.toThrow("Chapter not found");
  });

  it("should return empty array when chapter has no book blocks", async () => {
    mockChapterFindById.mockResolvedValue({
      _id: "chapter-id",
      bookId: "book-id",
      title: "Test Chapter",
    });

    mockBookBlockFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    });

    const result = await createKnowledgeChunks("chapter-id");

    expect(result).toEqual([]);
  });

  it("should create knowledge chunks with embeddings", async () => {
    mockChapterFindById.mockResolvedValue({
      _id: "chapter-id",
      bookId: "book-id",
      title: "Test Chapter",
    });

    const blocks = [
      {
        _id: "block-1",
        chapterId: "chapter-id",
        blockNumber: 1,
        englishText: Array(600).fill("study").join(" "),
      },
    ];

    mockBookBlockFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue(blocks),
    });

    const embedding = Array(1536).fill(0.1);

    mockGenerateEmbedding.mockResolvedValue(embedding);

    mockKnowledgeChunkCreate.mockImplementation(
      async (data) => data
    );

    const result = await createKnowledgeChunks("chapter-id");

    expect(result).toHaveLength(1);

    expect(mockGenerateEmbedding).toHaveBeenCalledTimes(1);

    expect(mockKnowledgeChunkCreate).toHaveBeenCalledTimes(1);

    expect(result[0]).toMatchObject({
      bookId: "book-id",
      chapterId: "chapter-id",
      content: expect.any(String),
      embedding,
      chunkIndex: 0,
      tokenCount: 600,
      metadata: {
        chapterTitle: "Test Chapter",
      },
    });
  });
});