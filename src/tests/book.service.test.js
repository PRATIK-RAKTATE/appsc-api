import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  bookCreateMock,
  bookFindMock,
  bookFindByIdMock,
  bookFindByIdAndDeleteMock,
  bookCountDocumentsMock,
  uploadJobCreateMock,
  uploadJobFindMock,
  uploadJobFindByIdMock,
  uploadJobFindOneMock,
  uploadJobDeleteManyMock,
  chapterFindMock,
  chapterDeleteManyMock,
  bookBlockDeleteManyMock,
  generatePresignedUploadUrlMock,
  getFileUrlMock,
  deleteFileFromR2Mock,
} = vi.hoisted(() => ({
  bookCreateMock: vi.fn(),
  bookFindMock: vi.fn(),
  bookFindByIdMock: vi.fn(),
  bookFindByIdAndDeleteMock: vi.fn(),
  bookCountDocumentsMock: vi.fn(),
  uploadJobCreateMock: vi.fn(),
  uploadJobFindMock: vi.fn(),
  uploadJobFindByIdMock: vi.fn(),
  uploadJobFindOneMock: vi.fn(),
  uploadJobDeleteManyMock: vi.fn(),
  chapterFindMock: vi.fn(),
  chapterDeleteManyMock: vi.fn(),
  bookBlockDeleteManyMock: vi.fn(),
  generatePresignedUploadUrlMock: vi.fn(),
  getFileUrlMock: vi.fn(),
  deleteFileFromR2Mock: vi.fn(),
}));

vi.mock("../models/book.model.js", () => ({
  Book: {
    create: bookCreateMock,
    find: bookFindMock,
    findById: bookFindByIdMock,
    findByIdAndDelete: bookFindByIdAndDeleteMock,
    countDocuments: bookCountDocumentsMock,
  },
  BOOK_STATUS: {
    UPLOADED: "UPLOADED",
    PROCESSING: "PROCESSING",
    TRANSLATING: "TRANSLATING",
    IN_REVIEW: "IN_REVIEW",
    PUBLISHED: "PUBLISHED",
    FAILED: "FAILED",
  },
  BOOK_LANGUAGES: {
    ENGLISH: "ENGLISH",
    TELUGU: "TELUGU",
  },
}));

vi.mock("../models/uploadJob.model.js", () => ({
  UploadJob: {
    create: uploadJobCreateMock,
    find: uploadJobFindMock,
    findById: uploadJobFindByIdMock,
    findOne: uploadJobFindOneMock,
    deleteMany: uploadJobDeleteManyMock,
  },
  UPLOAD_JOB_STATUS: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },
}));

vi.mock("../models/chapter.model.js", () => ({
  Chapter: {
    find: chapterFindMock,
    deleteMany: chapterDeleteManyMock,
  },
}));

vi.mock("../models/bookBlock.model.js", () => ({
  BookBlock: {
    deleteMany: bookBlockDeleteManyMock,
  },
}));

vi.mock("../services/r2.service.js", () => ({
  generatePresignedUploadUrl: generatePresignedUploadUrlMock,
  getFileUrl: getFileUrlMock,
  deleteFileFromR2: deleteFileFromR2Mock,
}));

import {
  createBook,
  getPresignedUploadForBook,
  confirmBookUpload,
  failBookUpload,
  listBooks,
  getBookById,
  updateBook,
  deleteBook,
  getUploadJobById,
  getUploadJobsByBook,
} from "../services/book.service.js";

describe("Book Service", () => {
  const userId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBook", () => {
    it("should create a book without file upload info", async () => {
      const bookData = {
        title: "Test Book",
        author: "Author Name",
        description: "A description",
      };

      const createdBook = {
        _id: "book-123",
        ...bookData,
        uploadedBy: userId,
      };

      bookCreateMock.mockResolvedValue(createdBook);

      const result = await createBook(bookData, userId);

      expect(bookCreateMock).toHaveBeenCalledTimes(1);
      expect(result.book).toBeDefined();
      expect(result.uploadUrl).toBeUndefined();
      expect(result.uploadJob).toBeUndefined();
    });

    it("should create a book and generate presigned URL when file details are provided", async () => {
      const bookData = {
        title: "Test Book",
        fileName: "test.pdf",
        mimeType: "application/pdf",
      };

      const createdBook = {
        _id: "book-123",
        title: "Test Book",
        uploadedBy: userId,
      };

      bookCreateMock.mockResolvedValue(createdBook);
      generatePresignedUploadUrlMock.mockResolvedValue("https://r2.example.com/upload-url");
      uploadJobCreateMock.mockResolvedValue({
        _id: "job-123",
        bookId: "book-123",
        status: "PENDING",
      });

      const result = await createBook(bookData, userId);

      expect(bookCreateMock).toHaveBeenCalledTimes(1);
      expect(generatePresignedUploadUrlMock).toHaveBeenCalledTimes(1);
      expect(uploadJobCreateMock).toHaveBeenCalledTimes(1);
      expect(result.uploadUrl).toBe("https://r2.example.com/upload-url");
      expect(result.uploadJob).toBeDefined();
      expect(result.fileKey).toContain("books/book-123/");
    });

    it("should throw error when title is missing", async () => {
      await expect(createBook({ title: "" }, userId)).rejects.toThrow(
        "Title is required"
      );
    });
  });

  describe("getPresignedUploadForBook", () => {
    it("should generate a presigned upload URL and create a pending upload job", async () => {
      const book = {
        _id: "book-123",
        title: "Existing Book",
      };

      bookFindByIdMock.mockResolvedValue(book);
      generatePresignedUploadUrlMock.mockResolvedValue("https://r2.example.com/presigned-url");
      uploadJobCreateMock.mockResolvedValue({
        _id: "job-456",
        bookId: "book-123",
        status: "PENDING",
      });

      const result = await getPresignedUploadForBook({
        bookId: "book-123",
        fileName: "document.pdf",
        mimeType: "application/pdf",
        userId,
      });

      expect(bookFindByIdMock).toHaveBeenCalledWith("book-123");
      expect(generatePresignedUploadUrlMock).toHaveBeenCalledTimes(1);
      expect(uploadJobCreateMock).toHaveBeenCalledTimes(1);
      expect(result.uploadUrl).toBe("https://r2.example.com/presigned-url");
      expect(result.uploadJob).toBeDefined();
      expect(result.fileKey).toContain("books/book-123/");
    });

    it("should throw error if book is not found", async () => {
      bookFindByIdMock.mockResolvedValue(null);

      await expect(
        getPresignedUploadForBook({
          bookId: "nonexistent",
          fileName: "file.pdf",
          mimeType: "application/pdf",
          userId,
        })
      ).rejects.toThrow("Book not found");
    });

    it("should throw error if fileName or mimeType is missing", async () => {
      await expect(
        getPresignedUploadForBook({
          bookId: "book-123",
          fileName: "",
          mimeType: "application/pdf",
          userId,
        })
      ).rejects.toThrow("fileName is required");

      await expect(
        getPresignedUploadForBook({
          bookId: "book-123",
          fileName: "file.pdf",
          mimeType: "",
          userId,
        })
      ).rejects.toThrow("mimeType is required");
    });
  });

  describe("confirmBookUpload", () => {
    it("should update upload job to COMPLETED and update book sourceFile", async () => {
      const uploadJob = {
        _id: "job-123",
        bookId: "book-123",
        fileKey: "books/book-123/file.pdf",
        fileName: "file.pdf",
        mimeType: "application/pdf",
        status: "PENDING",
        save: vi.fn().mockResolvedValue(true),
      };

      const book = {
        _id: "book-123",
        status: "UPLOADED",
        save: vi.fn().mockResolvedValue(true),
      };

      uploadJobFindByIdMock.mockResolvedValue(uploadJob);
      bookFindByIdMock.mockResolvedValue(book);
      getFileUrlMock.mockReturnValue("https://r2.example.com/books/book-123/file.pdf");

      const result = await confirmBookUpload({
        uploadJobId: "job-123",
        fileSize: 1048576,
      });

      expect(uploadJob.status).toBe("COMPLETED");
      expect(uploadJob.fileSize).toBe(1048576);
      expect(uploadJob.fileUrl).toBe("https://r2.example.com/books/book-123/file.pdf");
      expect(uploadJob.save).toHaveBeenCalled();

      expect(book.sourceFile).toEqual({
        fileName: "file.pdf",
        fileUrl: "https://r2.example.com/books/book-123/file.pdf",
        mimeType: "application/pdf",
      });
      expect(book.save).toHaveBeenCalled();

      expect(result.book).toBe(book);
      expect(result.uploadJob).toBe(uploadJob);
    });

    it("should find pending upload job by bookId when uploadJobId is not passed", async () => {
      const uploadJob = {
        _id: "job-123",
        bookId: "book-123",
        fileKey: "books/book-123/file.pdf",
        fileName: "file.pdf",
        mimeType: "application/pdf",
        status: "PENDING",
        save: vi.fn().mockResolvedValue(true),
      };

      const book = {
        _id: "book-123",
        save: vi.fn().mockResolvedValue(true),
      };

      uploadJobFindOneMock.mockReturnValue({
        sort: vi.fn().mockResolvedValue(uploadJob),
      });
      bookFindByIdMock.mockResolvedValue(book);
      getFileUrlMock.mockReturnValue("https://r2.example.com/books/book-123/file.pdf");

      const result = await confirmBookUpload({ bookId: "book-123" });

      expect(result.uploadJob.status).toBe("COMPLETED");
    });

    it("should throw error when upload job is not found", async () => {
      uploadJobFindByIdMock.mockResolvedValue(null);

      await expect(
        confirmBookUpload({ uploadJobId: "nonexistent" })
      ).rejects.toThrow("Upload job not found");
    });

    it("should throw error when book is not found", async () => {
      const uploadJob = {
        _id: "job-123",
        bookId: "nonexistent",
        save: vi.fn(),
      };

      uploadJobFindByIdMock.mockResolvedValue(uploadJob);
      bookFindByIdMock.mockResolvedValue(null);

      await expect(
        confirmBookUpload({ uploadJobId: "job-123" })
      ).rejects.toThrow("Book not found");
    });
  });

  describe("failBookUpload", () => {
    it("should mark upload job as FAILED with error message", async () => {
      const uploadJob = {
        _id: "job-123",
        status: "PENDING",
        save: vi.fn().mockResolvedValue(true),
      };

      uploadJobFindByIdMock.mockResolvedValue(uploadJob);

      const result = await failBookUpload({
        uploadJobId: "job-123",
        errorMessage: "Network error during upload",
      });

      expect(uploadJob.status).toBe("FAILED");
      expect(uploadJob.errorMessage).toBe("Network error during upload");
      expect(uploadJob.save).toHaveBeenCalled();
      expect(result.uploadJob).toBe(uploadJob);
    });
  });

  describe("listBooks", () => {
    it("should list books with pagination and filter", async () => {
      const books = [{ _id: "book-1", title: "Book 1" }];

      const sortMock = vi.fn().mockReturnThis();
      const skipMock = vi.fn().mockReturnThis();
      const limitMock = vi.fn().mockReturnThis();
      const populateMock = vi.fn().mockResolvedValue(books);

      bookFindMock.mockReturnValue({
        sort: sortMock,
        skip: skipMock,
        limit: limitMock,
        populate: populateMock,
      });

      bookCountDocumentsMock.mockResolvedValue(1);

      const result = await listBooks(
        { status: "UPLOADED", search: "Book" },
        { page: 1, limit: 10 }
      );

      expect(result.books).toEqual(books);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe("getBookById", () => {
    it("should return book by id", async () => {
      const book = { _id: "book-1", title: "Book 1" };
      bookFindByIdMock.mockReturnValue({
        populate: vi.fn().mockResolvedValue(book),
      });

      const result = await getBookById("book-1");
      expect(result).toEqual(book);
    });

    it("should throw error if book is not found", async () => {
      bookFindByIdMock.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      await expect(getBookById("nonexistent")).rejects.toThrow("Book not found");
    });
  });

  describe("updateBook", () => {
    it("should update allowed book fields", async () => {
      const book = {
        _id: "book-1",
        title: "Old Title",
        save: vi.fn().mockResolvedValue(true),
      };

      bookFindByIdMock.mockResolvedValue(book);

      const result = await updateBook("book-1", {
        title: "New Title",
        author: "New Author",
      });

      expect(book.title).toBe("New Title");
      expect(book.author).toBe("New Author");
      expect(book.save).toHaveBeenCalled();
      expect(result).toBe(book);
    });

    it("should throw error if book is not found", async () => {
      bookFindByIdMock.mockResolvedValue(null);

      await expect(
        updateBook("nonexistent", { title: "New Title" })
      ).rejects.toThrow("Book not found");
    });
  });

  describe("deleteBook", () => {
    it("should delete book and associated chapters, blocks, and upload jobs", async () => {
      const book = {
        _id: "book-1",
        sourceFile: {
          fileUrl: "https://r2.example.com/books/book-1/test.pdf",
        },
      };

      bookFindByIdMock.mockResolvedValue(book);
      chapterFindMock.mockResolvedValue([{ _id: "ch-1" }]);
      bookBlockDeleteManyMock.mockResolvedValue({ deletedCount: 5 });
      chapterDeleteManyMock.mockResolvedValue({ deletedCount: 1 });
      uploadJobDeleteManyMock.mockResolvedValue({ deletedCount: 2 });
      bookFindByIdAndDeleteMock.mockResolvedValue(book);

      const result = await deleteBook("book-1");

      expect(bookBlockDeleteManyMock).toHaveBeenCalledWith({
        chapterId: { $in: ["ch-1"] },
      });
      expect(chapterDeleteManyMock).toHaveBeenCalledWith({ bookId: "book-1" });
      expect(uploadJobDeleteManyMock).toHaveBeenCalledWith({ bookId: "book-1" });
      expect(bookFindByIdAndDeleteMock).toHaveBeenCalledWith("book-1");
      expect(result.success).toBe(true);
    });
  });

  describe("getUploadJobById and getUploadJobsByBook", () => {
    it("should return upload job by ID", async () => {
      const job = { _id: "job-1", status: "COMPLETED" };
      uploadJobFindByIdMock.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(job),
        }),
      });

      const result = await getUploadJobById("job-1");
      expect(result).toEqual(job);
    });

    it("should return upload jobs for a book", async () => {
      const jobs = [{ _id: "job-1" }, { _id: "job-2" }];
      uploadJobFindMock.mockReturnValue({
        sort: vi.fn().mockResolvedValue(jobs),
      });

      const result = await getUploadJobsByBook("book-1");
      expect(result).toEqual(jobs);
    });
  });
});
