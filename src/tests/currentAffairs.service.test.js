import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCurrentAffairsFind,
  mockCurrentAffairsFindById,
  mockCurrentAffairsFindByIdAndDelete,
  mockCurrentAffairsCountDocuments,
  mockCategoryFindById,
  mockCategoryFindOne,
  mockChunkDeleteMany,
  mockScheduleRAG,
  MockCurrentAffairsModel,
} = vi.hoisted(() => {
  const mockCurrentAffairsFind = vi.fn();
  const mockCurrentAffairsFindById = vi.fn();
  const mockCurrentAffairsFindByIdAndDelete = vi.fn();
  const mockCurrentAffairsCountDocuments = vi.fn();
  const mockCategoryFindById = vi.fn();
  const mockCategoryFindOne = vi.fn();
  const mockChunkDeleteMany = vi.fn();
  const mockScheduleRAG = vi.fn();

  class MockCurrentAffairsDoc {
    constructor(data) {
      Object.assign(this, data);
      this._id = this._id || "generated-id-" + Math.random().toString(36).substr(2, 9);
      this.save = vi.fn().mockResolvedValue(this);
    }
  }

  class MockCurrentAffairsModel extends MockCurrentAffairsDoc {
    static find = mockCurrentAffairsFind;
    static findById = mockCurrentAffairsFindById;
    static findByIdAndDelete = mockCurrentAffairsFindByIdAndDelete;
    static countDocuments = mockCurrentAffairsCountDocuments;
  }

  return {
    mockCurrentAffairsFind,
    mockCurrentAffairsFindById,
    mockCurrentAffairsFindByIdAndDelete,
    mockCurrentAffairsCountDocuments,
    mockCategoryFindById,
    mockCategoryFindOne,
    mockChunkDeleteMany,
    mockScheduleRAG,
    MockCurrentAffairsModel,
  };
});

vi.mock("../models/currentAffairs.model.js", () => {
  return {
    CurrentAffairs: MockCurrentAffairsModel,
    CURRENT_AFFAIRS_STATUS: {
      DRAFT: "DRAFT",
      PUBLISHED: "PUBLISHED",
      ARCHIVED: "ARCHIVED",
    },
    RAG_STATUS: {
      PENDING: "PENDING",
      PROCESSING: "PROCESSING",
      COMPLETED: "COMPLETED",
      FAILED: "FAILED",
    },
  };
});

vi.mock("../models/category.model.js", () => ({
  Category: {
    findById: mockCategoryFindById,
    findOne: mockCategoryFindOne,
  },
}));

vi.mock("../models/currentAffairsChunk.model.js", () => ({
  CurrentAffairsChunk: {
    deleteMany: mockChunkDeleteMany,
  },
}));

vi.mock("../queues/currentAffairsRag.queue.js", () => ({
  scheduleCurrentAffairsRagIngestion: mockScheduleRAG,
}));

import {
  createCurrentAffairs,
  publishCurrentAffairs,
  getCurrentAffairsById,
  getCurrentAffairs,
  updateCurrentAffairs,
  deleteCurrentAffairs,
} from "../services/currentAffairs.service.js";

describe("Current Affairs Service", () => {
  const categoryId = new mongoose.Types.ObjectId().toString();
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();

    mockCategoryFindById.mockResolvedValue({
      _id: categoryId,
      name: "State AP",
      slug: "state-ap",
    });

    mockCategoryFindOne.mockResolvedValue({
      _id: categoryId,
      name: "State AP",
      slug: "state-ap",
    });

    mockScheduleRAG.mockResolvedValue({ id: "job-1" });
    mockChunkDeleteMany.mockResolvedValue({ acknowledged: true });
  });

  describe("createCurrentAffairs", () => {
    it("should create a draft current affairs article without triggering RAG queue", async () => {
      const result = await createCurrentAffairs({
        title: "AP High Court Order",
        content: "New directive issued on municipal governance.",
        category: categoryId,
        createdBy: userId,
      });

      expect(result.title).toBe("AP High Court Order");
      expect(result.status).toBe("DRAFT");
      expect(result.publishedAt).toBeNull();
      expect(result.save).toHaveBeenCalled();
      expect(mockScheduleRAG).not.toHaveBeenCalled();
    });

    it("should resolve category by slug or name if string provided", async () => {
      mockCategoryFindById.mockResolvedValue(null);

      const result = await createCurrentAffairs({
        title: "National Economic Survey Highlights",
        content: "Detailed economic highlights released today.",
        category: "economy",
        createdBy: userId,
      });

      expect(mockCategoryFindOne).toHaveBeenCalled();
      expect(result.category).toBe(categoryId);
    });

    it("should reject if category does not exist", async () => {
      mockCategoryFindById.mockResolvedValue(null);
      mockCategoryFindOne.mockResolvedValue(null);

      await expect(
        createCurrentAffairs({
          title: "Unknown Category Article",
          content: "Content",
          category: "non-existent-category",
          createdBy: userId,
        })
      ).rejects.toThrow("Category not found");
    });

    it("should automatically trigger RAG queue when created as PUBLISHED", async () => {
      const result = await createCurrentAffairs({
        title: "AP Budget 2026-27 Approved",
        content: "Budget highlights and revenue allocations.",
        category: categoryId,
        createdBy: userId,
        status: "PUBLISHED",
      });

      expect(result.status).toBe("PUBLISHED");
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(mockScheduleRAG).toHaveBeenCalledWith(result._id);
    });
  });

  describe("publishCurrentAffairs", () => {
    it("should publish article, set publishedAt, and automatically queue RAG ingestion", async () => {
      const articleId = new mongoose.Types.ObjectId().toString();
      const article = new MockCurrentAffairsModel({
        _id: articleId,
        title: "AP River Linking Project Update",
        content: "Work begins on canal linking phase.",
        category: categoryId,
        status: "DRAFT",
        publishedAt: null,
      });

      mockCurrentAffairsFindById.mockResolvedValue(article);

      const published = await publishCurrentAffairs(articleId);

      expect(published.status).toBe("PUBLISHED");
      expect(published.publishedAt).toBeInstanceOf(Date);
      expect(published.ragStatus).toBe("PENDING");
      expect(published.save).toHaveBeenCalled();
      expect(mockScheduleRAG).toHaveBeenCalledWith(articleId);
    });

    it("should throw when article ID is missing", async () => {
      await expect(publishCurrentAffairs()).rejects.toThrow(
        "Article ID is required"
      );
    });

    it("should throw when article is not found", async () => {
      mockCurrentAffairsFindById.mockResolvedValue(null);

      await expect(publishCurrentAffairs("non-existent-id")).rejects.toThrow(
        "Current affairs article not found"
      );
    });
  });

  describe("getCurrentAffairsById", () => {
    it("should return populated article", async () => {
      const article = {
        _id: "ca-1",
        title: "Test Article",
      };

      const populateCategory = vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(article),
      });

      mockCurrentAffairsFindById.mockReturnValue({
        populate: populateCategory,
      });

      const result = await getCurrentAffairsById("ca-1");

      expect(result).toEqual(article);
    });
  });

  describe("getCurrentAffairs", () => {
    it("should list articles with pagination and filtering", async () => {
      const articles = [{ _id: "1" }, { _id: "2" }];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(articles),
      };

      mockCurrentAffairsFind.mockReturnValue(mockQuery);
      mockCurrentAffairsCountDocuments.mockResolvedValue(2);

      const result = await getCurrentAffairs(
        { category: categoryId, status: "PUBLISHED" },
        { page: 1, limit: 10 }
      );

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("updateCurrentAffairs", () => {
    it("should re-trigger RAG ingestion if published content changes", async () => {
      const articleId = "ca-1";
      const article = new MockCurrentAffairsModel({
        _id: articleId,
        title: "Original Title",
        content: "Original Content",
        status: "PUBLISHED",
        publishedAt: new Date(),
      });

      mockCurrentAffairsFindById.mockResolvedValue(article);

      const updated = await updateCurrentAffairs(articleId, {
        content: "Updated Content with fresh data",
      });

      expect(updated.content).toBe("Updated Content with fresh data");
      expect(mockScheduleRAG).toHaveBeenCalledWith(articleId);
    });
  });

  describe("deleteCurrentAffairs", () => {
    it("should delete article and its RAG chunks", async () => {
      const articleId = "ca-delete-1";
      mockCurrentAffairsFindByIdAndDelete.mockResolvedValue({ _id: articleId });

      const deleted = await deleteCurrentAffairs(articleId);

      expect(deleted._id).toBe(articleId);
      expect(mockChunkDeleteMany).toHaveBeenCalledWith({
        currentAffairsId: articleId,
      });
    });
  });
});
