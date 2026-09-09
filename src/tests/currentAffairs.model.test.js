import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import {
  CurrentAffairs,
  CURRENT_AFFAIRS_STATUS,
  RAG_STATUS,
} from "../models/currentAffairs.model.js";

describe("CurrentAffairs Model", () => {
  const validArticle = {
    title: "New AP Industrial Policy Announced",
    content: "<p>The Andhra Pradesh government announced a major industrial roadmap.</p>",
    category: new mongoose.Types.ObjectId(),
    createdBy: new mongoose.Types.ObjectId(),
    summary: "Brief summary of industrial policy in AP",
    tags: ["Andhra Pradesh", "Economy", "Industry"],
    source: "AP Information Bureau",
    sourceUrl: "https://example.com/ap-news",
    coverImageUrl: "https://example.com/images/ap-industry.png",
    attachments: [
      {
        url: "https://example.com/docs/policy.pdf",
        type: "pdf",
        caption: "Full Policy Document",
      },
    ],
  };

  it("should create a valid current affairs article with rich content", async () => {
    const article = new CurrentAffairs(validArticle);

    await expect(article.validate()).resolves.toBeUndefined();
    expect(article.status).toBe(CURRENT_AFFAIRS_STATUS.DRAFT);
    expect(article.ragStatus).toBe(RAG_STATUS.PENDING);
    expect(article.publishedAt).toBeNull();
    expect(article.tags).toEqual(["andhra pradesh", "economy", "industry"]);
    expect(article.attachments).toHaveLength(1);
    expect(article.attachments[0].url).toBe("https://example.com/docs/policy.pdf");
  });

  it("should require title", async () => {
    const article = new CurrentAffairs({
      ...validArticle,
      title: undefined,
    });

    await expect(article.validate()).rejects.toThrow();
  });

  it("should enforce title minlength and maxlength", async () => {
    const shortArticle = new CurrentAffairs({
      ...validArticle,
      title: "Hi",
    });
    await expect(shortArticle.validate()).rejects.toThrow();

    const longArticle = new CurrentAffairs({
      ...validArticle,
      title: "A".repeat(301),
    });
    await expect(longArticle.validate()).rejects.toThrow();
  });

  it("should require content", async () => {
    const article = new CurrentAffairs({
      ...validArticle,
      content: undefined,
    });

    await expect(article.validate()).rejects.toThrow();
  });

  it("should require category", async () => {
    const article = new CurrentAffairs({
      ...validArticle,
      category: undefined,
    });

    await expect(article.validate()).rejects.toThrow();
  });

  it("should require createdBy", async () => {
    const article = new CurrentAffairs({
      ...validArticle,
      createdBy: undefined,
    });

    await expect(article.validate()).rejects.toThrow();
  });

  it("should reject invalid status", async () => {
    const article = new CurrentAffairs({
      ...validArticle,
      status: "INVALID_STATUS",
    });

    await expect(article.validate()).rejects.toThrow();
  });

  it("should accept valid status transitions", async () => {
    const article = new CurrentAffairs({
      ...validArticle,
      status: CURRENT_AFFAIRS_STATUS.PUBLISHED,
      publishedAt: new Date(),
      ragStatus: RAG_STATUS.COMPLETED,
    });

    await expect(article.validate()).resolves.toBeUndefined();
    expect(article.status).toBe(CURRENT_AFFAIRS_STATUS.PUBLISHED);
    expect(article.ragStatus).toBe(RAG_STATUS.COMPLETED);
    expect(article.publishedAt).toBeInstanceOf(Date);
  });
});
