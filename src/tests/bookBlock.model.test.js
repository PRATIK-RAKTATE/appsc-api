import { describe, it, expect } from "vitest";
import {
  BookBlock,
  TRANSLATION_STATUS,
  REVIEW_STATUS,
} from "../models/bookBlock.model.js";

describe("BookBlock Model", () => {
  const validBlock = {
    chapterId: "507f1f77bcf86cd799439011",
    blockNumber: 1,
    englishText: "India is a diverse country.",
  };

  it("should create a valid book block", async () => {
    const block = new BookBlock(validBlock);

    await expect(block.validate()).resolves.toBeUndefined();
  });

  it("should require chapterId", async () => {
    const block = new BookBlock({
      ...validBlock,
      chapterId: undefined,
    });

    await expect(block.validate()).rejects.toThrow();
  });

  it("should require blockNumber", async () => {
    const block = new BookBlock({
      ...validBlock,
      blockNumber: undefined,
    });

    await expect(block.validate()).rejects.toThrow();
  });

  it("should reject blockNumber less than 1", async () => {
    const block = new BookBlock({
      ...validBlock,
      blockNumber: 0,
    });

    await expect(block.validate()).rejects.toThrow();
  });

  it("should require englishText", async () => {
    const block = new BookBlock({
      ...validBlock,
      englishText: undefined,
    });

    await expect(block.validate()).rejects.toThrow();
  });

  it("should allow teluguText to be empty initially", async () => {
    const block = new BookBlock(validBlock);

    expect(block.teluguText).toBeNull();

    await expect(block.validate()).resolves.toBeUndefined();
  });

  it("should use PENDING as the default translation status", () => {
    const block = new BookBlock(validBlock);

    expect(block.translationStatus).toBe(
      TRANSLATION_STATUS.PENDING
    );
  });

  it("should use PENDING as the default review status", () => {
    const block = new BookBlock(validBlock);

    expect(block.reviewStatus).toBe(REVIEW_STATUS.PENDING);
  });

  it("should reject an invalid translation status", async () => {
    const block = new BookBlock({
      ...validBlock,
      translationStatus: "INVALID",
    });

    await expect(block.validate()).rejects.toThrow();
  });

  it("should reject an invalid review status", async () => {
    const block = new BookBlock({
      ...validBlock,
      reviewStatus: "INVALID",
    });

    await expect(block.validate()).rejects.toThrow();
  });
});