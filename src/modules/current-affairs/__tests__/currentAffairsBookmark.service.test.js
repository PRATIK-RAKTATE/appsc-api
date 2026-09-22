import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCurrentAffairsBookmarkFindOne,
  mockCurrentAffairsBookmarkCreate,
  mockCurrentAffairsBookmarkFindByIdAndDelete,
  mockCurrentAffairsBookmarkFind,
  mockCurrentAffairsBookmarkCountDocuments,
} = vi.hoisted(() => {
  const mockCurrentAffairsBookmarkFindOne = vi.fn();
  const mockCurrentAffairsBookmarkCreate = vi.fn();
  const mockCurrentAffairsBookmarkFindByIdAndDelete = vi.fn();
  const mockCurrentAffairsBookmarkFind = vi.fn();
  const mockCurrentAffairsBookmarkCountDocuments = vi.fn();

  return {
    mockCurrentAffairsBookmarkFindOne,
    mockCurrentAffairsBookmarkCreate,
    mockCurrentAffairsBookmarkFindByIdAndDelete,
    mockCurrentAffairsBookmarkFind,
    mockCurrentAffairsBookmarkCountDocuments,
  };
});

vi.mock("../models/currentAffairsBookmark.model.js", () => ({
  CurrentAffairsBookmark: {
    findOne: mockCurrentAffairsBookmarkFindOne,
    create: mockCurrentAffairsBookmarkCreate,
    findByIdAndDelete: mockCurrentAffairsBookmarkFindByIdAndDelete,
    find: mockCurrentAffairsBookmarkFind,
    countDocuments: mockCurrentAffairsBookmarkCountDocuments,
  },
}));

import {
  toggleBookmark,
  isBookmarked,
  getUserBookmarks,
} from "../services/currentAffairsBookmark.service.js";

describe("Current Affairs Bookmark Service", () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const currentAffairsId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toggleBookmark", () => {
    it("should add a new bookmark when one does not exist", async () => {
      mockCurrentAffairsBookmarkFindOne.mockResolvedValue(null);
      mockCurrentAffairsBookmarkCreate.mockResolvedValue({
        _id: "bm-new",
        user: userId,
        currentAffairs: currentAffairsId,
      });

      const result = await toggleBookmark(userId, currentAffairsId);

      expect(mockCurrentAffairsBookmarkFindOne).toHaveBeenCalledWith({
        user: userId,
        currentAffairs: currentAffairsId,
      });
      expect(mockCurrentAffairsBookmarkCreate).toHaveBeenCalledWith({
        user: userId,
        currentAffairs: currentAffairsId,
      });
      expect(result).toEqual({
        bookmarked: true,
        bookmark: { _id: "bm-new", user: userId, currentAffairs: currentAffairsId },
      });
    });

    it("should remove existing bookmark (unbookmark) when one already exists", async () => {
      const existingBookmark = { _id: "bm-existing" };
      mockCurrentAffairsBookmarkFindOne.mockResolvedValue(existingBookmark);
      mockCurrentAffairsBookmarkFindByIdAndDelete.mockResolvedValue(existingBookmark);

      const result = await toggleBookmark(userId, currentAffairsId);

      expect(mockCurrentAffairsBookmarkFindByIdAndDelete).toHaveBeenCalledWith("bm-existing");
      expect(result).toEqual({ bookmarked: false, bookmark: null });
    });

    it("should throw when userId is missing", async () => {
      await expect(toggleBookmark(null, currentAffairsId)).rejects.toThrow(
        "userId and currentAffairsId are required"
      );
    });

    it("should throw when currentAffairsId is missing", async () => {
      await expect(toggleBookmark(userId, null)).rejects.toThrow(
        "userId and currentAffairsId are required"
      );
    });

    it("should handle concurrent create race condition (E11000) gracefully", async () => {
      mockCurrentAffairsBookmarkFindOne.mockResolvedValueOnce(null);
      const dupError = new Error("Duplicate key");
      dupError.code = 11000;
      mockCurrentAffairsBookmarkCreate.mockRejectedValueOnce(dupError);

      mockCurrentAffairsBookmarkFindOne.mockResolvedValueOnce({
        _id: "bm-race",
        user: userId,
        currentAffairs: currentAffairsId,
      });

      const result = await toggleBookmark(userId, currentAffairsId);

      expect(result.bookmarked).toBe(true);
      expect(result.bookmark).toEqual({
        _id: "bm-race",
        user: userId,
        currentAffairs: currentAffairsId,
      });
    });

    it("should re-throw non-duplicate errors from create", async () => {
      mockCurrentAffairsBookmarkFindOne.mockResolvedValue(null);
      mockCurrentAffairsBookmarkCreate.mockRejectedValue(
        new Error("Connection lost")
      );

      await expect(toggleBookmark(userId, currentAffairsId)).rejects.toThrow(
        "Connection lost"
      );
    });
  });

  describe("isBookmarked", () => {
    it("should return true when a bookmark exists", async () => {
      mockCurrentAffairsBookmarkFindOne.mockResolvedValue({ _id: "bm-1" });

      const result = await isBookmarked(userId, currentAffairsId);

      expect(result).toBe(true);
      expect(mockCurrentAffairsBookmarkFindOne).toHaveBeenCalledWith({
        user: userId,
        currentAffairs: currentAffairsId,
      });
    });

    it("should return false when no bookmark exists", async () => {
      mockCurrentAffairsBookmarkFindOne.mockResolvedValue(null);

      const result = await isBookmarked(userId, currentAffairsId);

      expect(result).toBe(false);
    });

    it("should return false when userId is missing", async () => {
      const result = await isBookmarked(null, currentAffairsId);
      expect(result).toBe(false);
      expect(mockCurrentAffairsBookmarkFindOne).not.toHaveBeenCalled();
    });

    it("should return false when currentAffairsId is missing", async () => {
      const result = await isBookmarked(userId, null);
      expect(result).toBe(false);
      expect(mockCurrentAffairsBookmarkFindOne).not.toHaveBeenCalled();
    });
  });

  describe("getUserBookmarks", () => {
    it("should return paginated bookmarks for a user", async () => {
      const bookmarks = [
        { _id: "bm-1", user: userId, currentAffairs: currentAffairsId },
        { _id: "bm-2", user: userId, currentAffairs: "ca-2" },
      ];

      const mockFind = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(bookmarks),
      };

      mockCurrentAffairsBookmarkFind.mockReturnValue(mockFind);
      mockCurrentAffairsBookmarkCountDocuments.mockResolvedValue(2);

      const result = await getUserBookmarks(userId, { page: 1, limit: 10 });

      expect(mockCurrentAffairsBookmarkFind).toHaveBeenCalledWith({ user: userId });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it("should throw when userId is missing", async () => {
      await expect(getUserBookmarks(null)).rejects.toThrow("userId is required");
      expect(mockCurrentAffairsBookmarkFind).not.toHaveBeenCalled();
    });

    it("should apply pagination defaults correctly", async () => {
      const mockFind = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      mockCurrentAffairsBookmarkFind.mockReturnValue(mockFind);
      mockCurrentAffairsBookmarkCountDocuments.mockResolvedValue(0);

      await getUserBookmarks(userId);

      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });

    it("should handle page 2 with limit 5 (skip 5)", async () => {
      const mockFind = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      mockCurrentAffairsBookmarkFind.mockReturnValue(mockFind);
      mockCurrentAffairsBookmarkCountDocuments.mockResolvedValue(0);

      await getUserBookmarks(userId, { page: 2, limit: 5 });

      expect(mockFind.skip).toHaveBeenCalledWith(5);
      expect(mockFind.limit).toHaveBeenCalledWith(5);
    });
  });
});
