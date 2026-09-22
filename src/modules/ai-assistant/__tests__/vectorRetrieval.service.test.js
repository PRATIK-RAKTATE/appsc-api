import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Hoist mocks before any module import ────────────────────────────────────
const { mockAggregate, mockGenerateQueryEmbedding } = vi.hoisted(() => ({
  mockAggregate: vi.fn(),
  mockGenerateQueryEmbedding: vi.fn(),
}));

vi.mock("../models/contentChunk.model.js", () => ({
  ContentChunk: {
    aggregate: mockAggregate,
  },
}));

vi.mock("../services/embedding.service.js", () => ({
  generateQueryEmbedding: mockGenerateQueryEmbedding,
  EMBEDDING_DIMENSIONS: 1536,
}));

import { retrieveSimilarChunks } from "../services/vectorRetrieval.service.js";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const makeVector = (val = 0.1) => Array(1536).fill(val);

const makeChunk = (overrides = {}) => ({
  _id: { toString: () => "chunk-abc" },
  content: "Sample study content about Indian history.",
  title: "Chapter 1",
  metadata: { subject: "History", language: "EN" },
  score: 0.85,
  ...overrides,
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("vectorRetrieval.service – retrieveSimilarChunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateQueryEmbedding.mockResolvedValue(makeVector());
    mockAggregate.mockResolvedValue([makeChunk()]);
  });

  // ── Input validation ──────────────────────────────────────────────────────
  describe("input validation", () => {
    it("should throw when query is missing", async () => {
      await expect(retrieveSimilarChunks({})).rejects.toThrow(
        "Query string is required"
      );
    });

    it("should throw when query is an empty string", async () => {
      await expect(retrieveSimilarChunks({ query: "" })).rejects.toThrow(
        "Query string is required"
      );
    });

    it("should throw when query is whitespace only", async () => {
      await expect(retrieveSimilarChunks({ query: "   " })).rejects.toThrow(
        "Query string is required"
      );
    });

    it("should throw when query is not a string", async () => {
      await expect(
        retrieveSimilarChunks({ query: 42 })
      ).rejects.toThrow("Query string is required");
    });

    it("should throw when called with no arguments", async () => {
      await expect(retrieveSimilarChunks()).rejects.toThrow(
        "Query string is required"
      );
    });
  });

  // ── Happy path ────────────────────────────────────────────────────────────
  describe("happy path", () => {
    it("should call generateQueryEmbedding with the trimmed query", async () => {
      await retrieveSimilarChunks({ query: "  Indian history  " });
      expect(mockGenerateQueryEmbedding).toHaveBeenCalledWith("Indian history");
    });

    it("should build and execute a $vectorSearch aggregation pipeline", async () => {
      await retrieveSimilarChunks({ query: "polity" });
      expect(mockAggregate).toHaveBeenCalledTimes(1);

      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[0]).toHaveProperty("$vectorSearch");
      expect(pipeline[0].$vectorSearch.path).toBe("embedding");
      expect(pipeline[0].$vectorSearch.queryVector).toEqual(makeVector());
    });

    it("should project vectorSearchScore as 'score'", async () => {
      await retrieveSimilarChunks({ query: "polity" });
      const pipeline = mockAggregate.mock.calls[0][0];
      const projectStage = pipeline[1];
      expect(projectStage.$project.score).toEqual({ $meta: "vectorSearchScore" });
    });

    it("should include a $match stage to filter by minScore", async () => {
      await retrieveSimilarChunks({ query: "polity", minScore: 0.75 });
      const pipeline = mockAggregate.mock.calls[0][0];
      const matchStage = pipeline[2];
      expect(matchStage.$match.score.$gte).toBe(0.75);
    });

    it("should use default minScore 0.70 when not provided", async () => {
      await retrieveSimilarChunks({ query: "polity" });
      const pipeline = mockAggregate.mock.calls[0][0];
      const matchStage = pipeline[2];
      expect(matchStage.$match.score.$gte).toBe(0.7);
    });

    it("should return formatted results with correct keys", async () => {
      const result = await retrieveSimilarChunks({ query: "polity" });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        chunkId: "chunk-abc",
        content: "Sample study content about Indian history.",
        title: "Chapter 1",
        score: 0.85,
        metadata: { subject: "History", language: "EN" },
      });
    });

    it("should return an empty array when aggregation yields no results", async () => {
      mockAggregate.mockResolvedValue([]);
      const result = await retrieveSimilarChunks({ query: "obscure topic" });
      expect(result).toEqual([]);
    });
  });

  // ── Limit handling ────────────────────────────────────────────────────────
  describe("limit clamping", () => {
    it("should clamp limit to MAX_LIMIT=20", async () => {
      await retrieveSimilarChunks({ query: "test", limit: 100 });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[0].$vectorSearch.limit).toBe(20);
    });

    it("should default limit to 5 when not provided", async () => {
      await retrieveSimilarChunks({ query: "test" });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[0].$vectorSearch.limit).toBe(5);
    });

    it("should set numCandidates to max(limit*15, 100)", async () => {
      await retrieveSimilarChunks({ query: "test", limit: 3 });
      const pipeline = mockAggregate.mock.calls[0][0];
      // 3 * 15 = 45 < 100, so numCandidates should be 100
      expect(pipeline[0].$vectorSearch.numCandidates).toBe(100);
    });

    it("should scale numCandidates with larger limits", async () => {
      await retrieveSimilarChunks({ query: "test", limit: 20 });
      const pipeline = mockAggregate.mock.calls[0][0];
      // 20 * 15 = 300 > 100
      expect(pipeline[0].$vectorSearch.numCandidates).toBe(300);
    });
  });

  // ── Filter handling ───────────────────────────────────────────────────────
  describe("filter stage", () => {
    it("should omit filter key from $vectorSearch when no filters provided", async () => {
      await retrieveSimilarChunks({ query: "test" });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[0].$vectorSearch).not.toHaveProperty("filter");
    });

    it("should include filter when bookId is provided", async () => {
      const bookId = "6123456789abcdef01234567";
      await retrieveSimilarChunks({ query: "test", filters: { bookId } });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[0].$vectorSearch).toHaveProperty("filter");
    });

    it("should include filter when subject is provided", async () => {
      await retrieveSimilarChunks({
        query: "test",
        filters: { subject: "Polity" },
      });
      const pipeline = mockAggregate.mock.calls[0][0];
      const filter = pipeline[0].$vectorSearch.filter;
      expect(filter).toMatchObject({ "metadata.subject": { $eq: "Polity" } });
    });

    it("should include filter when language is provided", async () => {
      await retrieveSimilarChunks({
        query: "test",
        filters: { language: "TE" },
      });
      const pipeline = mockAggregate.mock.calls[0][0];
      const filter = pipeline[0].$vectorSearch.filter;
      expect(filter).toMatchObject({ "metadata.language": { $eq: "TE" } });
    });

    it("should combine multiple filters with $and", async () => {
      await retrieveSimilarChunks({
        query: "test",
        filters: { subject: "History", language: "EN" },
      });
      const pipeline = mockAggregate.mock.calls[0][0];
      const filter = pipeline[0].$vectorSearch.filter;
      expect(filter).toHaveProperty("$and");
      expect(filter.$and).toHaveLength(2);
    });

    it("should ignore invalid language values", async () => {
      await retrieveSimilarChunks({
        query: "test",
        filters: { language: "FR" }, // unsupported
      });
      const pipeline = mockAggregate.mock.calls[0][0];
      // No valid filter conditions → filter key should be absent
      expect(pipeline[0].$vectorSearch).not.toHaveProperty("filter");
    });

    it("should ignore invalid bookId string", async () => {
      await retrieveSimilarChunks({
        query: "test",
        filters: { bookId: "not-a-valid-objectid" },
      });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[0].$vectorSearch).not.toHaveProperty("filter");
    });
  });

  // ── Score threshold filtering ─────────────────────────────────────────────
  describe("score threshold filtering", () => {
    it("should only return chunks meeting minScore threshold", async () => {
      // Simulate aggregation already filtering (pipeline $match handles it in Atlas)
      // Here we verify the service passes minScore=0.80 correctly into the pipeline
      await retrieveSimilarChunks({ query: "exam tips", minScore: 0.80 });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[2].$match.score.$gte).toBe(0.80);
    });

    it("should fall back to default minScore when value is out of range", async () => {
      await retrieveSimilarChunks({ query: "test", minScore: 1.5 });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[2].$match.score.$gte).toBe(0.7);
    });

    it("should fall back to default minScore when value is negative", async () => {
      await retrieveSimilarChunks({ query: "test", minScore: -0.1 });
      const pipeline = mockAggregate.mock.calls[0][0];
      expect(pipeline[2].$match.score.$gte).toBe(0.7);
    });
  });

  // ── Error handling ────────────────────────────────────────────────────────
  describe("error handling", () => {
    it("should throw with friendly message when embedding generation fails", async () => {
      mockGenerateQueryEmbedding.mockRejectedValue(
        new Error("Embedding API timeout")
      );

      await expect(
        retrieveSimilarChunks({ query: "test query" })
      ).rejects.toThrow("Failed to generate query embedding: Embedding API timeout");
    });

    it("should throw with friendly message when aggregation fails", async () => {
      mockAggregate.mockRejectedValue(
        new Error("Atlas connection refused")
      );

      await expect(
        retrieveSimilarChunks({ query: "test query" })
      ).rejects.toThrow("Vector search aggregation failed: Atlas connection refused");
    });
  });
});
