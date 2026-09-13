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

const getUserId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

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
