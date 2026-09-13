import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createCurrentAffairsMock,
  publishCurrentAffairsMock,
  getCurrentAffairsByIdMock,
  getCurrentAffairsMock,
  updateCurrentAffairsMock,
  deleteCurrentAffairsMock,
} = vi.hoisted(() => ({
  createCurrentAffairsMock: vi.fn(),
  publishCurrentAffairsMock: vi.fn(),
  getCurrentAffairsByIdMock: vi.fn(),
  getCurrentAffairsMock: vi.fn(),
  updateCurrentAffairsMock: vi.fn(),
  deleteCurrentAffairsMock: vi.fn(),
}));

vi.mock("../services/currentAffairs.service.js", () => ({
  createCurrentAffairs: createCurrentAffairsMock,
  publishCurrentAffairs: publishCurrentAffairsMock,
  getCurrentAffairsById: getCurrentAffairsByIdMock,
  getCurrentAffairs: getCurrentAffairsMock,
  updateCurrentAffairs: updateCurrentAffairsMock,
  deleteCurrentAffairs: deleteCurrentAffairsMock,
}));

import {
  createCurrentAffairsController,
  publishCurrentAffairsController,
  getCurrentAffairsByIdController,
  getCurrentAffairsController,
  updateCurrentAffairsController,
  deleteCurrentAffairsController,
} from "../controllers/currentAffairs.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("Current Affairs Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCurrentAffairsController", () => {
    it("should return 400 if title, content, or category is missing", async () => {
      const res = createResponse();
      await createCurrentAffairsController({ body: { title: "Title" } }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("should return 400 if createdBy is missing", async () => {
      const res = createResponse();
      await createCurrentAffairsController(
        {
          body: {
            title: "Title",
            content: "Content",
            category: "cat-1",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "CreatedBy user ID is required",
        })
      );
    });

    it("should create article and return 201", async () => {
      const res = createResponse();
      const article = { _id: "ca-1", title: "New Article" };
      createCurrentAffairsMock.mockResolvedValue(article);

      await createCurrentAffairsController(
        {
          body: {
            title: "New Article",
            content: "Content",
            category: "cat-1",
          },
          user: { userId: "user-123" },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Current affairs article created successfully",
        data: article,
      });
    });
  });

  describe("publishCurrentAffairsController", () => {
    it("should publish article and return 200", async () => {
      const res = createResponse();
      const published = { _id: "ca-1", status: "PUBLISHED" };
      publishCurrentAffairsMock.mockResolvedValue(published);

      await publishCurrentAffairsController({ params: { id: "ca-1" } }, res);

      expect(publishCurrentAffairsMock).toHaveBeenCalledWith("ca-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Current affairs article published and RAG ingestion queued",
        data: published,
      });
    });

    it("should handle error during publish", async () => {
      const res = createResponse();
      publishCurrentAffairsMock.mockRejectedValue(new Error("Article not found"));

      await publishCurrentAffairsController({ params: { id: "ca-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Article not found",
      });
    });
  });

  describe("getCurrentAffairsByIdController", () => {
    it("should fetch article by ID", async () => {
      const res = createResponse();
      const article = { _id: "ca-1", title: "Article" };
      getCurrentAffairsByIdMock.mockResolvedValue(article);

      await getCurrentAffairsByIdController({ params: { id: "ca-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: article,
      });
    });
  });

  describe("getCurrentAffairsController", () => {
    it("should list articles with pagination", async () => {
      const res = createResponse();
      const result = {
        data: [{ _id: "1" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      getCurrentAffairsMock.mockResolvedValue(result);

      await getCurrentAffairsController(
        { query: { category: "cat-1", page: "1", limit: "10" } },
        res
      );

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
  });

  describe("updateCurrentAffairsController", () => {
    it("should update article", async () => {
      const res = createResponse();
      const updated = { _id: "ca-1", title: "Updated" };
      updateCurrentAffairsMock.mockResolvedValue(updated);

      await updateCurrentAffairsController(
        { params: { id: "ca-1" }, body: { title: "Updated" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Current affairs article updated successfully",
        data: updated,
      });
    });
  });

  describe("deleteCurrentAffairsController", () => {
    it("should delete article", async () => {
      const res = createResponse();
      const deleted = { _id: "ca-1" };
      deleteCurrentAffairsMock.mockResolvedValue(deleted);

      await deleteCurrentAffairsController({ params: { id: "ca-1" } }, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Current affairs article deleted successfully",
        data: deleted,
      });
    });
  });
});
