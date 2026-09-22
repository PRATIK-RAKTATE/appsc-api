import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockToggleBookmark,
  mockIsBookmarked,
  mockGetUserBookmarks,
} = vi.hoisted(() => ({
  mockToggleBookmark: vi.fn(),
  mockIsBookmarked: vi.fn(),
  mockGetUserBookmarks: vi.fn(),
}));

vi.mock("../services/currentAffairsBookmark.service.js", () => ({
  toggleBookmark: mockToggleBookmark,
  isBookmarked: mockIsBookmarked,
  getUserBookmarks: mockGetUserBookmarks,
}));

import {
  toggleBookmarkController,
  checkBookmarkController,
  getUserBookmarksController,
} from "../controllers/currentAffairsBookmark.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("Current Affairs Bookmark Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toggleBookmarkController", () => {
    it("should toggle bookmark on and return 200 with bookmarked=true", async () => {
      const res = createResponse();
      mockToggleBookmark.mockResolvedValue({
        bookmarked: true,
        bookmark: { _id: "bm-1", user: "user-1", currentAffairs: "ca-1" },
      });

      await toggleBookmarkController(
        { user: { userId: "user-1" }, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(mockToggleBookmark).toHaveBeenCalledWith("user-1", "ca-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          bookmarked: true,
          bookmark: { _id: "bm-1", user: "user-1", currentAffairs: "ca-1" },
        },
      });
    });

    it("should toggle bookmark off and return 200 with bookmarked=false", async () => {
      const res = createResponse();
      mockToggleBookmark.mockResolvedValue({
        bookmarked: false,
        bookmark: null,
      });

      await toggleBookmarkController(
        { user: { userId: "user-1" }, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { bookmarked: false, bookmark: null },
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = createResponse();

      await toggleBookmarkController(
        { user: undefined, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentication required",
      });
    });

    it("should handle error and return 500", async () => {
      const res = createResponse();
      mockToggleBookmark.mockRejectedValue(new Error("DB error"));

      await toggleBookmarkController(
        { user: { userId: "user-1" }, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "DB error",
      });
    });
  });

  describe("checkBookmarkController", () => {
    it("should return bookmarked=true when article is bookmarked", async () => {
      const res = createResponse();
      mockIsBookmarked.mockResolvedValue(true);

      await checkBookmarkController(
        { user: { userId: "user-1" }, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(mockIsBookmarked).toHaveBeenCalledWith("user-1", "ca-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { bookmarked: true },
      });
    });

    it("should return bookmarked=false when article is not bookmarked", async () => {
      const res = createResponse();
      mockIsBookmarked.mockResolvedValue(false);

      await checkBookmarkController(
        { user: { userId: "user-1" }, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { bookmarked: false },
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = createResponse();

      await checkBookmarkController(
        { user: undefined, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should handle error and return 500", async () => {
      const res = createResponse();
      mockIsBookmarked.mockRejectedValue(new Error("DB error"));

      await checkBookmarkController(
        { user: { userId: "user-1" }, params: { currentAffairsId: "ca-1" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "DB error",
      });
    });
  });

  describe("getUserBookmarksController", () => {
    it("should return paginated list of bookmarks for the user", async () => {
      const res = createResponse();
      const result = {
        data: [{ _id: "bm-1" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockGetUserBookmarks.mockResolvedValue(result);

      await getUserBookmarksController(
        { user: { userId: "user-1" }, query: { page: "1", limit: "10" } },
        res
      );

      expect(mockGetUserBookmarks).toHaveBeenCalledWith("user-1", {
        page: "1",
        limit: "10",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result.data,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      const res = createResponse();

      await getUserBookmarksController(
        { user: undefined, query: { page: "1", limit: "10" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should handle error and return 500", async () => {
      const res = createResponse();
      mockGetUserBookmarks.mockRejectedValue(new Error("DB error"));

      await getUserBookmarksController(
        { user: { userId: "user-1" }, query: {} },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "DB error",
      });
    });
  });
});
