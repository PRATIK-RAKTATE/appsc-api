import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  reindexBookMock,
} = vi.hoisted(() => ({
  reindexBookMock: vi.fn(),
}));

vi.mock("../services/book.service.js", () => ({
  createBook: vi.fn(),
  getPresignedUploadForBook: vi.fn(),
  confirmBookUpload: vi.fn(),
  failBookUpload: vi.fn(),
  listBooks: vi.fn(),
  getBookById: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
  getUploadJobById: vi.fn(),
  getUploadJobsByBook: vi.fn(),
  createBookBlock: vi.fn(),
  getBookReader: vi.fn(),
  getReadingProgress: vi.fn(),
  searchBookBlocks: vi.fn(),
  reindexBook: reindexBookMock,
}));

import { reindexBookController } from "../controllers/book.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("Book Reindex Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when bookId is missing", async () => {
    const req = {
      params: {},
    };

    const res = createResponse();

    await reindexBookController(req, res);

    expect(reindexBookMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Book ID is required",
    });
  });

  it("should reindex a book successfully", async () => {
    const req = {
      params: {
        bookId: "507f1f77bcf86cd799439011",
      },
    };

    const res = createResponse();

    reindexBookMock.mockResolvedValue({
      bookId: "507f1f77bcf86cd799439011",
      chapterCount: 3,
      jobIds: ["job-1", "job-2", "job-3"],
      message: "Reindexing scheduled for 3 chapter(s)",
    });

    await reindexBookController(req, res);

    expect(reindexBookMock).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Reindexing scheduled for 3 chapter(s)",
      data: {
        bookId: "507f1f77bcf86cd799439011",
        chapterCount: 3,
        jobIds: ["job-1", "job-2", "job-3"],
        message: "Reindexing scheduled for 3 chapter(s)",
      },
    });
  });

  it("should return 404 when book is not found", async () => {
    const req = {
      params: {
        bookId: "507f1f77bcf86cd799439011",
      },
    };

    const res = createResponse();

    reindexBookMock.mockRejectedValue(
      new Error("Book not found")
    );

    await reindexBookController(req, res);

    expect(reindexBookMock).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Book not found",
    });
  });

  it("should return 500 when reindexing fails", async () => {
    const req = {
      params: {
        bookId: "507f1f77bcf86cd799439011",
      },
    };

    const res = createResponse();

    reindexBookMock.mockRejectedValue(
      new Error("Database error")
    );

    await reindexBookController(req, res);

    expect(reindexBookMock).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Database error",
    });
  });

  it("should handle book with no chapters", async () => {
    const req = {
      params: {
        bookId: "507f1f77bcf86cd799439011",
      },
    };

    const res = createResponse();

    reindexBookMock.mockResolvedValue({
      bookId: "507f1f77bcf86cd799439011",
      chapterCount: 0,
      jobIds: [],
      message: "No chapters found to reindex",
    });

    await reindexBookController(req, res);

    expect(reindexBookMock).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "No chapters found to reindex",
      data: {
        bookId: "507f1f77bcf86cd799439011",
        chapterCount: 0,
        jobIds: [],
        message: "No chapters found to reindex",
      },
    });
  });
});
