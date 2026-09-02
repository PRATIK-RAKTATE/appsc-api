import { describe, it, expect } from "vitest";
import {
  Book,
  BOOK_LANGUAGES,
  BOOK_STATUS,
} from "../models/book.model.js";

describe("Book Model", () => {
  const validBook = {
    title: "Sample Book",
    sourceLanguage: BOOK_LANGUAGES.ENGLISH,
    targetLanguage: BOOK_LANGUAGES.TELUGU,
    uploadedBy: "507f1f77bcf86cd799439011",
  };

  it("should create a valid book", async () => {
    const book = new Book(validBook);

    await expect(book.validate()).resolves.toBeUndefined();
  });

  it("should require title", async () => {
    const book = new Book({
      ...validBook,
      title: undefined,
    });

    await expect(book.validate()).rejects.toThrow();
  });

  it("should use UPLOADED as the default status", () => {
    const book = new Book(validBook);

    expect(book.status).toBe(BOOK_STATUS.UPLOADED);
  });

  it("should reject an invalid source language", async () => {
    const book = new Book({
      ...validBook,
      sourceLanguage: "HINDI",
    });

    await expect(book.validate()).rejects.toThrow();
  });

  it("should reject an invalid target language", async () => {
    const book = new Book({
      ...validBook,
      targetLanguage: "HINDI",
    });

    await expect(book.validate()).rejects.toThrow();
  });

  it("should require uploadedBy", async () => {
    const book = new Book({
      ...validBook,
      uploadedBy: undefined,
    });

    await expect(book.validate()).rejects.toThrow();
  });
});