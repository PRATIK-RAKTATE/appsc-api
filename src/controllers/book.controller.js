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
  createBookBlock,
  getBookReader,
  getReadingProgress,
  searchBookBlocks,
} from "../services/book.service.js";
import { scheduleReadingProgress } from "../services/readingProgress.queue.service.js";

const getUserId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

// --- Book Management & R2 Upload Handlers ---

export const createBookController = async (req, res) => {
  try {
    const { title } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const userId = getUserId(req);
    const result = await createBook(req.body, userId);

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create book error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create book",
    });
  }
};

export const getPresignedUploadController = async (req, res) => {
  try {
    const bookId = req.params.id || req.body.bookId;
    const { fileName, mimeType } = req.body || {};

    if (!fileName || !fileName.trim() || !mimeType || !mimeType.trim()) {
      return res.status(400).json({
        success: false,
        message: "fileName and mimeType are required",
      });
    }

    const userId = getUserId(req);
    const result = await getPresignedUploadForBook({
      bookId,
      fileName,
      mimeType,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Presigned upload URL generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get presigned upload error:", error);
    const status = error.message === "Book not found" ? 404 : 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to generate presigned upload URL",
    });
  }
};

export const confirmUploadController = async (req, res) => {
  try {
    const bookId = req.params.id || req.body.bookId;
    const { uploadJobId, fileSize } = req.body || {};

    const result = await confirmBookUpload({
      bookId,
      uploadJobId,
      fileSize,
    });

    return res.status(200).json({
      success: true,
      message: "Book upload confirmed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Confirm upload error:", error);
    const status =
      error.message === "Upload job not found" ||
      error.message === "Book not found"
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to confirm book upload",
    });
  }
};

export const failUploadController = async (req, res) => {
  try {
    const bookId = req.params.id || req.body.bookId;
    const { uploadJobId, errorMessage } = req.body || {};

    const result = await failBookUpload({
      bookId,
      uploadJobId,
      errorMessage,
    });

    return res.status(200).json({
      success: true,
      message: "Book upload marked as failed",
      data: result,
    });
  } catch (error) {
    console.error("Fail upload error:", error);
    const status = error.message === "Upload job not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update upload status",
    });
  }
};

export const listBooksController = async (req, res) => {
  try {
    const { status, sourceLanguage, targetLanguage, search, page, limit } =
      req.query || {};

    const result = await listBooks(
      { status, sourceLanguage, targetLanguage, search },
      { page, limit }
    );

    return res.status(200).json({
      success: true,
      message: "Books retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("List books error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve books",
    });
  }
};

export const getBookByIdController = async (req, res) => {
  try {
    const book = await getBookById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Book retrieved successfully",
      data: book,
    });
  } catch (error) {
    console.error("Get book by ID error:", error);
    const status = error.message === "Book not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve book",
    });
  }
};

export const updateBookController = async (req, res) => {
  try {
    const book = await updateBook(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    console.error("Update book error:", error);
    const status = error.message === "Book not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to update book",
    });
  }
};

export const deleteBookController = async (req, res) => {
  try {
    const result = await deleteBook(req.params.id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete book error:", error);
    const status = error.message === "Book not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to delete book",
    });
  }
};

export const getUploadJobController = async (req, res) => {
  try {
    const uploadJob = await getUploadJobById(req.params.jobId);

    return res.status(200).json({
      success: true,
      message: "Upload job retrieved successfully",
      data: uploadJob,
    });
  } catch (error) {
    console.error("Get upload job error:", error);
    const status = error.message === "Upload job not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve upload job",
    });
  }
};

export const getBookUploadJobsController = async (req, res) => {
  try {
    const uploadJobs = await getUploadJobsByBook(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Upload jobs retrieved successfully",
      data: uploadJobs,
    });
  } catch (error) {
    console.error("Get book upload jobs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve upload jobs",
    });
  }
};

// --- Book Reading & Content Handlers ---

export const createBookBlockController = async (req, res) => {
  try {
    const { chapterId, blockNumber, contentEn } = req.body;

    if (!chapterId || !blockNumber || !contentEn) {
      return res.status(400).json({
        success: false,
        message: "chapterId, blockNumber and contentEn are required",
      });
    }

    const bookBlock = await createBookBlock({
      chapterId,
      blockNumber,
      contentEn,
    });

    return res.status(201).json({
      success: true,
      message: "BookBlock created and translation job added",
      data: bookBlock,
    });
  } catch (error) {
    console.error("Create BookBlock error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create BookBlock",
      error: error.message,
    });
  }
};

export const getBookReaderController = async (req, res) => {
  try {
    const { bookId } = req.params;

    const data = await getBookReader(bookId);

    return res.status(200).json({
      success: true,
      message: "Book reader data fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get book reader error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReadingProgressController = async (req, res) => {
  try {
    const { bookId } = req.params;

    const progress = await getReadingProgress(req.user.userId, bookId);

    return res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Get reading progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reading progress",
    });
  }
};

export const saveReadingProgressController = async (req, res) => {
  try {
    const { bookId } = req.params;

    const {
      chapterId,
      blockNumber,
      scrollPosition,
      language,
      fontSize,
      theme,
    } = req.body;

    if (
      !chapterId ||
      !blockNumber ||
      scrollPosition === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "chapterId, blockNumber and scrollPosition are required",
      });
    }

    await scheduleReadingProgress({
      userId: req.user.userId,
      bookId,
      chapterId,
      blockNumber,
      scrollPosition,
      language,
      fontSize,
      theme,
    });

    return res.status(202).json({
      success: true,
      message: "Reading progress update scheduled",
    });
  } catch (error) {
    console.error("Schedule reading progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to schedule reading progress",
    });
  }
};

export const searchBookBlocksController = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { q, chapterId, limit } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query 'q' is required",
      });
    }

    const results = await searchBookBlocks({
      bookId,
      q,
      chapterId,
      limit: Number(limit),
    });

    return res.status(200).json({
      success: true,
      message: "Search results retrieved successfully",
      data: results,
    });
  } catch (error) {
    console.error("Search book blocks error:", error);

    if (error.message === "Book ID is required" || error.message === "Search query is required") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to search book blocks",
    });
  }
};
