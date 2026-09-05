
import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getBookReader,
  getReadingProgress,
  saveReadingProgress,
} = vi.hoisted(() => ({
  getBookReader: vi.fn(),
  getReadingProgress: vi.fn(),
  saveReadingProgress: vi.fn(),
}));

vi.mock("../services/book.service.js", () => ({
  createBookBlock: vi.fn(),
  getBookReader,
  getReadingProgress,
  saveReadingProgress,
}));

import {
  getBookReaderController,
  getReadingProgressController,
  saveReadingProgressController,
} from "../controllers/book.controller.js";

describe("Book Reading Controllers", () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: {
        bookId: "507f1f77bcf86cd799439011",
      },
      user: {
        userId: "507f1f77bcf86cd799439012",
      },
      body: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("getBookReaderController", () => {
    it("should return book reader data successfully", async () => {
      const readerData = {
        book: {
          _id: req.params.bookId,
          title: "Sample Book",
        },
        chapters: [
          {
            _id: "chapter123",
            chapterNumber: 1,
            title: "Chapter 1",
          },
        ],
        blocks: [
          {
            blockNumber: 1,
            englishText: "Hello",
            teluguText: "హలో",
          },
        ],
      };

      getBookReader.mockResolvedValue(readerData);

      await getBookReaderController(req, res);

      expect(getBookReader).toHaveBeenCalledWith(req.params.bookId);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Book reader data fetched successfully",
        data: readerData,
      });
    });

    it("should return 500 when book is not found", async () => {
      getBookReader.mockRejectedValue(new Error("Book not found"));

      await getBookReaderController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Book not found",
      });
    });
  });

  describe("getReadingProgressController", () => {
    it("should return reading progress successfully", async () => {
      const progress = {
        userId: req.user.userId,
        bookId: req.params.bookId,
        chapterId: "chapter123",
        blockNumber: 3,
        scrollPosition: 450,
        language: "ENGLISH",
        fontSize: 16,
        theme: "LIGHT",
      };

      getReadingProgress.mockResolvedValue(progress);

      await getReadingProgressController(req, res);

      expect(getReadingProgress).toHaveBeenCalledWith(
        req.user.userId,
        req.params.bookId
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: progress,
      });
    });

    it("should return null when no progress exists", async () => {
      getReadingProgress.mockResolvedValue(null);

      await getReadingProgressController(req, res);

      expect(getReadingProgress).toHaveBeenCalledWith(
        req.user.userId,
        req.params.bookId
      );

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });
  });

  describe("saveReadingProgressController", () => {
    it("should save reading progress successfully", async () => {
      req.body = {
        chapterId: "chapter123",
        blockNumber: 5,
        scrollPosition: 750,
        language: "TELUGU",
        fontSize: 18,
        theme: "SEPIA",
      };

      const savedProgress = {
        userId: req.user.userId,
        bookId: req.params.bookId,
        ...req.body,
      };

      saveReadingProgress.mockResolvedValue(savedProgress);

      await saveReadingProgressController(req, res);

      expect(saveReadingProgress).toHaveBeenCalledWith({
        userId: req.user.userId,
        bookId: req.params.bookId,
        chapterId: "chapter123",
        blockNumber: 5,
        scrollPosition: 750,
        language: "TELUGU",
        fontSize: 18,
        theme: "SEPIA",
      });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Reading progress saved successfully",
        data: savedProgress,
      });
    });

    it("should return 400 when required fields are missing", async () => {
      req.body = {
        chapterId: "chapter123",
      };

      await saveReadingProgressController(req, res);

      expect(saveReadingProgress).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "chapterId, blockNumber and scrollPosition are required",
      });
    });

    it("should accept scrollPosition 0", async () => {
      req.body = {
        chapterId: "chapter123",
        blockNumber: 1,
        scrollPosition: 0,
        language: "ENGLISH",
        fontSize: 16,
        theme: "LIGHT",
      };

      const savedProgress = {
        userId: req.user.userId,
        bookId: req.params.bookId,
        ...req.body,
      };

      saveReadingProgress.mockResolvedValue(savedProgress);

      await saveReadingProgressController(req, res);

      expect(saveReadingProgress).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 500 when saving progress fails", async () => {
      req.body = {
        chapterId: "chapter123",
        blockNumber: 1,
        scrollPosition: 100,
      };

      saveReadingProgress.mockRejectedValue(
        new Error("Database error")
      );

      await saveReadingProgressController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to save reading progress",
      });
    });
  });
});

