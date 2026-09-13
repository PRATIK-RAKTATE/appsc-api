import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  createBookMock,
  getPresignedUploadForBookMock,
  confirmBookUploadMock,
  failBookUploadMock,
  listBooksMock,
  getBookByIdMock,
  updateBookMock,
  deleteBookMock,
  getUploadJobByIdMock,
  getUploadJobsByBookMock,
} = vi.hoisted(() => ({
  createBookMock: vi.fn(),
  getPresignedUploadForBookMock: vi.fn(),
  confirmBookUploadMock: vi.fn(),
  failBookUploadMock: vi.fn(),
  listBooksMock: vi.fn(),
  getBookByIdMock: vi.fn(),
  updateBookMock: vi.fn(),
  deleteBookMock: vi.fn(),
  getUploadJobByIdMock: vi.fn(),
  getUploadJobsByBookMock: vi.fn(),
}));

vi.mock("../services/book.service.js", () => ({
  createBook: createBookMock,
  getPresignedUploadForBook: getPresignedUploadForBookMock,
  confirmBookUpload: confirmBookUploadMock,
  failBookUpload: failBookUploadMock,
  listBooks: listBooksMock,
  getBookById: getBookByIdMock,
  updateBook: updateBookMock,
  deleteBook: deleteBookMock,
  getUploadJobById: getUploadJobByIdMock,
  getUploadJobsByBook: getUploadJobsByBookMock,
  createBookBlock: vi.fn(),
  getBookReader: vi.fn(),
  getReadingProgress: vi.fn(),
  saveReadingProgress: vi.fn(),
}));

vi.mock("../services/readingProgress.queue.service.js", () => ({
  scheduleReadingProgress: vi.fn(),
}));

import {
  createBookController,
  getPresignedUploadController,
  confirmUploadController,
  failUploadController,
  listBooksController,
  getBookByIdController,
  updateBookController,
  deleteBookController,
  getUploadJobController,
  getBookUploadJobsController,
} from "../controllers/book.controller.js";

describe("Book Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      user: {
        userId: "user-123",
        role: "ADMIN",
        email: "admin@example.com",
      },
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe("createBookController", () => {
    it("should return 201 when book is created", async () => {
      req.body = { title: "New Book" };
      createBookMock.mockResolvedValue({
        book: { _id: "book-1", title: "New Book" },
      });

      await createBookController(req, res);

      expect(createBookMock).toHaveBeenCalledWith(req.body, "user-123");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Book created successfully",
        data: { book: { _id: "book-1", title: "New Book" } },
      });
    });

    it("should return 400 when title is missing", async () => {
      req.body = { title: "" };

      await createBookController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Title is required",
      });
      expect(createBookMock).not.toHaveBeenCalled();
    });

    it("should return 500 when creation fails", async () => {
      req.body = { title: "Error Book" };
      createBookMock.mockRejectedValue(new Error("Database error"));

      await createBookController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("getPresignedUploadController", () => {
    it("should return 200 with presigned upload URL", async () => {
      req.params = { id: "book-1" };
      req.body = { fileName: "source.pdf", mimeType: "application/pdf" };

      const uploadResult = {
        uploadUrl: "https://r2.example.com/put",
        uploadJob: { _id: "job-1" },
        fileKey: "books/book-1/source.pdf",
      };
      getPresignedUploadForBookMock.mockResolvedValue(uploadResult);

      await getPresignedUploadController(req, res);

      expect(getPresignedUploadForBookMock).toHaveBeenCalledWith({
        bookId: "book-1",
        fileName: "source.pdf",
        mimeType: "application/pdf",
        userId: "user-123",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Presigned upload URL generated successfully",
        data: uploadResult,
      });
    });

    it("should return 400 if fileName or mimeType is missing", async () => {
      req.params = { id: "book-1" };
      req.body = { fileName: "" };

      await getPresignedUploadController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "fileName and mimeType are required",
      });
    });

    it("should return 404 if book is not found", async () => {
      req.params = { id: "nonexistent" };
      req.body = { fileName: "doc.pdf", mimeType: "application/pdf" };
      getPresignedUploadForBookMock.mockRejectedValue(new Error("Book not found"));

      await getPresignedUploadController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Book not found",
      });
    });
  });

  describe("confirmUploadController", () => {
    it("should return 200 on confirmed upload", async () => {
      req.params = { id: "book-1" };
      req.body = { uploadJobId: "job-1", fileSize: 2048 };

      const confirmedData = {
        book: { _id: "book-1", status: "UPLOADED" },
        uploadJob: { _id: "job-1", status: "COMPLETED" },
      };
      confirmBookUploadMock.mockResolvedValue(confirmedData);

      await confirmUploadController(req, res);

      expect(confirmBookUploadMock).toHaveBeenCalledWith({
        bookId: "book-1",
        uploadJobId: "job-1",
        fileSize: 2048,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Book upload confirmed successfully",
        data: confirmedData,
      });
    });

    it("should return 404 if upload job or book is not found", async () => {
      req.params = { id: "book-1" };
      confirmBookUploadMock.mockRejectedValue(new Error("Upload job not found"));

      await confirmUploadController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Upload job not found",
      });
    });
  });

  describe("failUploadController", () => {
    it("should return 200 on failing upload", async () => {
      req.params = { id: "book-1" };
      req.body = { uploadJobId: "job-1", errorMessage: "Failed transfer" };

      const failResult = {
        uploadJob: { _id: "job-1", status: "FAILED" },
      };
      failBookUploadMock.mockResolvedValue(failResult);

      await failUploadController(req, res);

      expect(failBookUploadMock).toHaveBeenCalledWith({
        bookId: "book-1",
        uploadJobId: "job-1",
        errorMessage: "Failed transfer",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Book upload marked as failed",
        data: failResult,
      });
    });
  });

  describe("listBooksController", () => {
    it("should return 200 with list of books", async () => {
      req.query = { page: "1", limit: "10" };
      const listResult = {
        books: [{ _id: "book-1" }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      listBooksMock.mockResolvedValue(listResult);

      await listBooksController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Books retrieved successfully",
        data: listResult,
      });
    });
  });

  describe("getBookByIdController", () => {
    it("should return 200 with book details", async () => {
      req.params = { id: "book-1" };
      const book = { _id: "book-1", title: "Book One" };
      getBookByIdMock.mockResolvedValue(book);

      await getBookByIdController(req, res);

      expect(getBookByIdMock).toHaveBeenCalledWith("book-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Book retrieved successfully",
        data: book,
      });
    });

    it("should return 404 if book not found", async () => {
      req.params = { id: "missing" };
      getBookByIdMock.mockRejectedValue(new Error("Book not found"));

      await getBookByIdController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Book not found",
      });
    });
  });

  describe("updateBookController", () => {
    it("should return 200 with updated book", async () => {
      req.params = { id: "book-1" };
      req.body = { title: "Updated" };
      const book = { _id: "book-1", title: "Updated" };
      updateBookMock.mockResolvedValue(book);

      await updateBookController(req, res);

      expect(updateBookMock).toHaveBeenCalledWith("book-1", req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Book updated successfully",
        data: book,
      });
    });
  });

  describe("deleteBookController", () => {
    it("should return 200 when book is deleted", async () => {
      req.params = { id: "book-1" };
      deleteBookMock.mockResolvedValue({
        success: true,
        message: "Book deleted successfully",
      });

      await deleteBookController(req, res);

      expect(deleteBookMock).toHaveBeenCalledWith("book-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Book deleted successfully",
      });
    });
  });

  describe("getUploadJobController & getBookUploadJobsController", () => {
    it("should return upload job by ID", async () => {
      req.params = { jobId: "job-1" };
      const job = { _id: "job-1", status: "COMPLETED" };
      getUploadJobByIdMock.mockResolvedValue(job);

      await getUploadJobController(req, res);

      expect(getUploadJobByIdMock).toHaveBeenCalledWith("job-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Upload job retrieved successfully",
        data: job,
      });
    });

    it("should return list of upload jobs for a book", async () => {
      req.params = { id: "book-1" };
      const jobs = [{ _id: "job-1" }];
      getUploadJobsByBookMock.mockResolvedValue(jobs);

      await getBookUploadJobsController(req, res);

      expect(getUploadJobsByBookMock).toHaveBeenCalledWith("book-1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Upload jobs retrieved successfully",
        data: jobs,
      });
    });
  });
});
