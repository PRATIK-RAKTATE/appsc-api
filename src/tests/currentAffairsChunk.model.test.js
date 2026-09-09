import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { CurrentAffairsChunk } from "../models/currentAffairsChunk.model.js";

describe("CurrentAffairsChunk Model", () => {
  const validChunk = {
    currentAffairsId: new mongoose.Types.ObjectId(),
    categoryId: new mongoose.Types.ObjectId(),
    content: "Sample chunk content for current affairs vector store.",
    embedding: Array(1536).fill(0.05),
    chunkIndex: 0,
    tokenCount: 50,
    metadata: {
      title: "Sample Article",
      categorySlug: "state-ap",
      categoryName: "State AP",
      tags: ["state", "ap"],
      publishedAt: new Date(),
    },
  };

  it("should create a valid current affairs chunk", async () => {
    const chunk = new CurrentAffairsChunk(validChunk);

    await expect(chunk.validate()).resolves.toBeUndefined();
    expect(chunk.chunkIndex).toBe(0);
    expect(chunk.tokenCount).toBe(50);
    expect(chunk.embedding).toHaveLength(1536);
  });

  it("should require currentAffairsId", async () => {
    const chunk = new CurrentAffairsChunk({
      ...validChunk,
      currentAffairsId: undefined,
    });

    await expect(chunk.validate()).rejects.toThrow();
  });

  it("should require categoryId", async () => {
    const chunk = new CurrentAffairsChunk({
      ...validChunk,
      categoryId: undefined,
    });

    await expect(chunk.validate()).rejects.toThrow();
  });

  it("should require content", async () => {
    const chunk = new CurrentAffairsChunk({
      ...validChunk,
      content: undefined,
    });

    await expect(chunk.validate()).rejects.toThrow();
  });

  it("should require non-empty embedding", async () => {
    const chunk = new CurrentAffairsChunk({
      ...validChunk,
      embedding: [],
    });

    await expect(chunk.validate()).rejects.toThrow("Embedding cannot be empty");
  });

  it("should reject negative chunkIndex", async () => {
    const chunk = new CurrentAffairsChunk({
      ...validChunk,
      chunkIndex: -1,
    });

    await expect(chunk.validate()).rejects.toThrow();
  });

  it("should reject tokenCount less than 1", async () => {
    const chunk = new CurrentAffairsChunk({
      ...validChunk,
      tokenCount: 0,
    });

    await expect(chunk.validate()).rejects.toThrow();
  });
});
