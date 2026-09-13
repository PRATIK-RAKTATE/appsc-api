import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCurrentAffairsFindById,
  mockCurrentAffairsFindByIdAndUpdate,
  mockChunkBulkWrite,
  mockChunkDeleteMany,
  mockChunkFind,
  mockGenerateEmbedding,
} = vi.hoisted(() => ({
  mockCurrentAffairsFindById: vi.fn(),
  mockCurrentAffairsFindByIdAndUpdate: vi.fn(),
  mockChunkBulkWrite: vi.fn(),
  mockChunkDeleteMany: vi.fn(),
  mockChunkFind: vi.fn(),
  mockGenerateEmbedding: vi.fn(),
}));

vi.mock("../models/currentAffairs.model.js", () => ({
  CurrentAffairs: {
    findById: mockCurrentAffairsFindById,
    findByIdAndUpdate: mockCurrentAffairsFindByIdAndUpdate,
  },
  CURRENT_AFFAIRS_STATUS: {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
  },
  RAG_STATUS: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },
}));

vi.mock("../models/currentAffairsChunk.model.js", () => ({
  CurrentAffairsChunk: {
    bulkWrite: mockChunkBulkWrite,
    deleteMany: mockChunkDeleteMany,
    find: mockChunkFind,
  },
}));

vi.mock("../services/embedding.service.js", () => ({
  generateEmbedding: mockGenerateEmbedding,
}));

import {
  cleanTextForRAG,
  ingestCurrentAffairsRAG,
} from "../services/currentAffairsRag.service.js";

describe("Current Affairs RAG Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockChunkBulkWrite.mockResolvedValue({ acknowledged: true });
    mockChunkDeleteMany.mockResolvedValue({ acknowledged: true });
    mockChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        {
          _id: "chunk-1",
          currentAffairsId: "ca-1",
          chunkIndex: 0,
          tokenCount: 20,
          embedding: Array(1536).fill(0.1),
        },
      ]),
    });
  });

  describe("cleanTextForRAG", () => {
    it("should strip HTML tags and decode common entities", () => {
      const html = "<h1>Title</h1><p>This is a &amp; <b>bold</b> statement with &nbsp;spaces.</p>";
      const cleaned = cleanTextForRAG(html);
      expect(cleaned).toBe("Title This is a & bold statement with spaces.");
    });

    it("should remove scripts and styles", () => {
      const html = "<style>body { color: red; }</style><p>Text</p><script>alert('hi')</script>";
      expect(cleanTextForRAG(html)).toBe("Text");
    });

    it("should return empty string for null or non-string input", () => {
      expect(cleanTextForRAG("")).toBe("");
      expect(cleanTextForRAG(null)).toBe("");
      expect(cleanTextForRAG(undefined)).toBe("");
    });
  });

  describe("ingestCurrentAffairsRAG", () => {
    it("should throw when currentAffairsId is missing", async () => {
      await expect(ingestCurrentAffairsRAG()).rejects.toThrow(
        "Current affairs ID is required"
      );
    });

    it("should throw when article is not found", async () => {
      mockCurrentAffairsFindById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      await expect(ingestCurrentAffairsRAG("non-existent-id")).rejects.toThrow(
        "Current affairs article not found"
      );
    });

    it("should process article, generate embeddings and store chunks", async () => {
      const article = {
        _id: "ca-123",
        title: "AP Semiconductor Policy",
        summary: "Andhra Pradesh announces semiconductor hub",
        content: "<p>The state government has allocated 500 acres for semiconductor plants.</p>",
        category: {
          _id: "cat-1",
          name: "State AP",
          slug: "state-ap",
        },
        tags: ["ap", "chips", "semiconductor"],
        publishedAt: new Date("2026-09-01"),
      };

      mockCurrentAffairsFindById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(article),
      });

      const fakeEmbedding = Array(1536).fill(0.2);
      mockGenerateEmbedding.mockResolvedValue(fakeEmbedding);

      const result = await ingestCurrentAffairsRAG("ca-123");

      expect(mockCurrentAffairsFindByIdAndUpdate).toHaveBeenCalledWith("ca-123", {
        ragStatus: "PROCESSING",
      });

      expect(mockGenerateEmbedding).toHaveBeenCalled();
      expect(mockChunkBulkWrite).toHaveBeenCalledTimes(1);

      const writeOperations = mockChunkBulkWrite.mock.calls[0][0];
      expect(writeOperations[0].updateOne.update.$set).toMatchObject({
        currentAffairsId: "ca-123",
        categoryId: "cat-1",
        embedding: fakeEmbedding,
        chunkIndex: 0,
        metadata: {
          title: "AP Semiconductor Policy",
          categorySlug: "state-ap",
          categoryName: "State AP",
          tags: ["ap", "chips", "semiconductor"],
        },
      });

      expect(mockChunkDeleteMany).toHaveBeenCalledWith({
        currentAffairsId: "ca-123",
        chunkIndex: { $gte: 1 },
      });

      expect(mockCurrentAffairsFindByIdAndUpdate).toHaveBeenCalledWith("ca-123", {
        ragStatus: "COMPLETED",
        ragIndexedAt: expect.any(Date),
      });

      expect(result).toHaveLength(1);
    });

    it("should set ragStatus to FAILED if error occurs during ingestion", async () => {
      const article = {
        _id: "ca-error",
        title: "Failing article",
        content: "Content",
        category: { _id: "cat-1" },
      };

      mockCurrentAffairsFindById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(article),
      });

      mockGenerateEmbedding.mockRejectedValue(new Error("Embedding generation failed"));

      await expect(ingestCurrentAffairsRAG("ca-error")).rejects.toThrow(
        "Embedding generation failed"
      );

      expect(mockCurrentAffairsFindByIdAndUpdate).toHaveBeenCalledWith("ca-error", {
        ragStatus: "FAILED",
      });
    });
  });
});
