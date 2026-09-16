import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

describe("Embedding Service", () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();

    process.env.OPENROUTER_API_KEY = "test-api-key";
    process.env.OPENROUTER_EMBEDDING_MODEL =
      "google/gemini-embedding-001";
  });

  it("should generate a 1536-dimensional embedding", async () => {
    const embedding = Array(1536).fill(0.1);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            embedding,
          },
        ],
      }),
    });

    const { generateEmbedding } = await import(
      "../services/embedding.service.js"
    );

    const result = await generateEmbedding("Sample study content");

    expect(result).toHaveLength(1536);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should reject empty text", async () => {
    const { generateEmbedding } = await import(
      "../services/embedding.service.js"
    );

    await expect(generateEmbedding("")).rejects.toThrow(
      "Text is required for embedding generation"
    );
  });

  it("should reject invalid embedding response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{}],
      }),
    });

    const { generateEmbedding } = await import(
      "../services/embedding.service.js"
    );

    await expect(
      generateEmbedding("Sample study content")
    ).rejects.toThrow("Invalid embedding response");
  });

  it("should handle OpenRouter API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: async () => "Unauthorized",
    });

    const { generateEmbedding } = await import(
      "../services/embedding.service.js"
    );

    await expect(
      generateEmbedding("Sample study content")
    ).rejects.toThrow("Embedding generation failed");
  });

  // ── generateQueryEmbedding ──────────────────────────────────────────────
  describe("generateQueryEmbedding", () => {
    it("should generate a 1536-dimensional embedding for a valid query", async () => {
      const embedding = Array(1536).fill(0.5);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ embedding }] }),
      });

      const { generateQueryEmbedding } = await import(
        "../services/embedding.service.js"
      );

      const result = await generateQueryEmbedding("What is democracy?");
      expect(result).toHaveLength(1536);
      expect(result).toEqual(embedding);
    });

    it("should trim the query before sending to the API", async () => {
      const embedding = Array(1536).fill(0.1);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ embedding }] }),
      });

      const { generateQueryEmbedding } = await import(
        "../services/embedding.service.js"
      );

      await generateQueryEmbedding("  polity fundamentals  ");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.input).toBe("polity fundamentals");
    });

    it("should throw when query is empty string", async () => {
      const { generateQueryEmbedding } = await import(
        "../services/embedding.service.js"
      );
      await expect(generateQueryEmbedding("")).rejects.toThrow(
        "Query text is required"
      );
    });

    it("should throw when query is whitespace only", async () => {
      const { generateQueryEmbedding } = await import(
        "../services/embedding.service.js"
      );
      await expect(generateQueryEmbedding("   ")).rejects.toThrow(
        "Query text is required"
      );
    });

    it("should throw when query is null", async () => {
      const { generateQueryEmbedding } = await import(
        "../services/embedding.service.js"
      );
      await expect(generateQueryEmbedding(null)).rejects.toThrow(
        "Query text is required"
      );
    });

    it("should throw when query is undefined", async () => {
      const { generateQueryEmbedding } = await import(
        "../services/embedding.service.js"
      );
      await expect(generateQueryEmbedding(undefined)).rejects.toThrow(
        "Query text is required"
      );
    });
  });
});