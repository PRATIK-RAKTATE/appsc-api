import { describe, it, expect } from "vitest";
import {
  Chapter,
  CHAPTER_STATUS,
} from "../models/chapter.model.js";

describe("Chapter Model", () => {
  const validChapter = {
    bookId: "507f1f77bcf86cd799439011",
    title: "Chapter One",
    chapterNumber: 1,
  };

  it("should create a valid chapter", async () => {
    const chapter = new Chapter(validChapter);

    await expect(chapter.validate()).resolves.toBeUndefined();
  });

  it("should require bookId", async () => {
    const chapter = new Chapter({
      ...validChapter,
      bookId: undefined,
    });

    await expect(chapter.validate()).rejects.toThrow();
  });

  it("should require title", async () => {
    const chapter = new Chapter({
      ...validChapter,
      title: undefined,
    });

    await expect(chapter.validate()).rejects.toThrow();
  });

  it("should require chapterNumber", async () => {
    const chapter = new Chapter({
      ...validChapter,
      chapterNumber: undefined,
    });

    await expect(chapter.validate()).rejects.toThrow();
  });

  it("should reject chapterNumber less than 1", async () => {
    const chapter = new Chapter({
      ...validChapter,
      chapterNumber: 0,
    });

    await expect(chapter.validate()).rejects.toThrow();
  });

  it("should use PENDING as the default status", () => {
    const chapter = new Chapter(validChapter);

    expect(chapter.status).toBe(CHAPTER_STATUS.PENDING);
  });

  it("should reject an invalid status", async () => {
    const chapter = new Chapter({
      ...validChapter,
      status: "INVALID",
    });

    await expect(chapter.validate()).rejects.toThrow();
  });
});