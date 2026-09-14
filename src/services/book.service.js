import mongoose from "mongoose";
import { Book, BOOK_STATUS } from "../models/book.model.js";
import { Chapter } from "../models/chapter.model.js";
import { BookBlock } from "../models/bookBlock.model.js";
import { ReadingProgress } from "../models/readingProgress.model.js";
import { UploadJob, UPLOAD_JOB_STATUS } from "../models/uploadJob.model.js";
import { addTranslationJob } from "./translation.queue.service.js";
import {
  generatePresignedUploadUrl,
  getFileUrl,
  deleteFileFromR2,
} from "./r2.service.js";

const sanitizeFileName = (fileName = "document") => {
  return fileName.replace(/[^a-zA-Z0-9_.-]/g, "_").substring(0, 100);
};

/**
 * Create a new book with metadata.
 * Optionally initiates a presigned upload if fileName and mimeType are provided.
 */
export const createBook = async (bookData, userId) => {
  const {
    title,
    author,
    description,
    sourceLanguage,
    targetLanguage,
    status,
    sourceFile,
    fileName,
    mimeType,
  } = bookData;

  if (!title || !title.trim()) {
    throw new Error("Title is required");
  }

  const bookId = new mongoose.Types.ObjectId();

  const bookDoc = {
    _id: bookId,
    title: title.trim(),
    author: author ? author.trim() : undefined,
    description: description ? description.trim() : undefined,
    sourceLanguage,
    targetLanguage,
    status: status || BOOK_STATUS.UPLOADED,
    uploadedBy: userId,
  };

  if (sourceFile) {
    bookDoc.sourceFile = sourceFile;
  }

  const book = await Book.create(bookDoc);

  // If file upload details are provided, generate a presigned upload URL and create an upload job
  if (fileName && mimeType) {
    const cleanName = sanitizeFileName(fileName);
    const key = `books/${book._id}/${Date.now()}-${cleanName}`;
    const uploadUrl = await generatePresignedUploadUrl({
      key,
      contentType: mimeType,
    });

    const uploadJob = await UploadJob.create({
      bookId: book._id,
      fileKey: key,
      fileName,
      mimeType,
      uploadedBy: userId,
      status: UPLOAD_JOB_STATUS.PENDING,
    });

    return {
      book,
      uploadUrl,
      uploadJob,
      fileKey: key,
    };
  }

  return { book };
};

/**
 * Generate a direct presigned upload URL for a book.
 */
export const getPresignedUploadForBook = async ({
  bookId,
  fileName,
  mimeType,
  userId,
}) => {
  if (!bookId) {
    throw new Error("Book ID is required");
  }

  if (!fileName || !fileName.trim()) {
    throw new Error("fileName is required");
  }

  if (!mimeType || !mimeType.trim()) {
    throw new Error("mimeType is required");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error("Book not found");
  }

  const cleanName = sanitizeFileName(fileName);
  const key = `books/${book._id}/${Date.now()}-${cleanName}`;

  const uploadUrl = await generatePresignedUploadUrl({
    key,
    contentType: mimeType.trim(),
  });

  const uploadJob = await UploadJob.create({
    bookId: book._id,
    fileKey: key,
    fileName: fileName.trim(),
    mimeType: mimeType.trim(),
    uploadedBy: userId,
    status: UPLOAD_JOB_STATUS.PENDING,
  });

  return {
    uploadUrl,
    uploadJob,
    fileKey: key,
  };
};

/**
 * Confirm that a client has completed direct upload to Cloudflare R2.
 */
export const confirmBookUpload = async ({ bookId, uploadJobId, fileSize }) => {
  let uploadJob;

  if (uploadJobId) {
    uploadJob = await UploadJob.findById(uploadJobId);
  } else if (bookId) {
    uploadJob = await UploadJob.findOne({
      bookId,
      status: UPLOAD_JOB_STATUS.PENDING,
    }).sort({ createdAt: -1 });
  }

  if (!uploadJob) {
    throw new Error("Upload job not found");
  }

  const targetBookId = bookId || uploadJob.bookId;
  const book = await Book.findById(targetBookId);
  if (!book) {
    throw new Error("Book not found");
  }

  const fileUrl = getFileUrl(uploadJob.fileKey);

  uploadJob.status = UPLOAD_JOB_STATUS.COMPLETED;
  if (fileSize !== undefined) {
    uploadJob.fileSize = fileSize;
  }
  uploadJob.fileUrl = fileUrl;
  await uploadJob.save();

  book.sourceFile = {
    fileName: uploadJob.fileName,
    fileUrl,
    mimeType: uploadJob.mimeType,
  };
  book.status = BOOK_STATUS.UPLOADED;
  await book.save();

  return {
    book,
    uploadJob,
  };
};

/**
 * Mark an upload job as failed.
 */
export const failBookUpload = async ({ bookId, uploadJobId, errorMessage }) => {
  let uploadJob;

  if (uploadJobId) {
    uploadJob = await UploadJob.findById(uploadJobId);
  } else if (bookId) {
    uploadJob = await UploadJob.findOne({
      bookId,
      status: UPLOAD_JOB_STATUS.PENDING,
    }).sort({ createdAt: -1 });
  }

  if (!uploadJob) {
    throw new Error("Upload job not found");
  }

  uploadJob.status = UPLOAD_JOB_STATUS.FAILED;
  if (errorMessage) {
    uploadJob.errorMessage = errorMessage;
  }
  await uploadJob.save();

  return { uploadJob };
};

/**
 * List books with filtering and pagination.
 */
export const listBooks = async (filter = {}, pagination = {}) => {
  const query = {};

  if (filter.status) {
    query.status = filter.status;
  }

  if (filter.sourceLanguage) {
    query.sourceLanguage = filter.sourceLanguage;
  }

  if (filter.targetLanguage) {
    query.targetLanguage = filter.targetLanguage;
  }

  if (filter.search) {
    const searchRegex = new RegExp(filter.search.trim(), "i");
    query.$or = [{ title: searchRegex }, { author: searchRegex }];
  }

  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(pagination.limit) || 10));
  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    Book.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "name email role"),
    Book.countDocuments(query),
  ]);

  return {
    books,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single book by ID.
 */
export const getBookById = async (bookId) => {
  if (!bookId) {
    throw new Error("Book ID is required");
  }

  const book = await Book.findById(bookId).populate(
    "uploadedBy",
    "name email role"
  );

  if (!book) {
    throw new Error("Book not found");
  }

  return book;
};

/**
 * Update book metadata.
 */
export const updateBook = async (bookId, updateData) => {
  if (!bookId) {
    throw new Error("Book ID is required");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error("Book not found");
  }

  const allowedUpdates = [
    "title",
    "author",
    "description",
    "sourceLanguage",
    "targetLanguage",
    "status",
  ];

  for (const field of allowedUpdates) {
    if (updateData[field] !== undefined) {
      book[field] = updateData[field];
    }
  }

  await book.save();
  return book;
};

/**
 * Delete a book and its related chapters, blocks, and upload jobs.
 */
export const deleteBook = async (bookId) => {
  if (!bookId) {
    throw new Error("Book ID is required");
  }

  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error("Book not found");
  }

  const chapters = await Chapter.find({ bookId });
  const chapterIds = chapters.map((c) => c._id);

  if (chapterIds.length > 0) {
    await BookBlock.deleteMany({ chapterId: { $in: chapterIds } });
  }

  await Chapter.deleteMany({ bookId });
  await UploadJob.deleteMany({ bookId });

  if (book.sourceFile?.fileUrl) {
    try {
      const match = book.sourceFile.fileUrl.match(/books\/[^?]+/);
      if (match) {
        await deleteFileFromR2(match[0]);
      }
    } catch {
      // Ignore cleanup error during delete
    }
  }

  await Book.findByIdAndDelete(bookId);

  return { success: true, message: "Book deleted successfully" };
};

/**
 * Get an upload job by ID.
 */
export const getUploadJobById = async (jobId) => {
  if (!jobId) {
    throw new Error("Upload job ID is required");
  }

  const uploadJob = await UploadJob.findById(jobId)
    .populate("bookId", "title status")
    .populate("uploadedBy", "name email");

  if (!uploadJob) {
    throw new Error("Upload job not found");
  }

  return uploadJob;
};

/**
 * Get all upload jobs for a book.
 */
export const getUploadJobsByBook = async (bookId) => {
  if (!bookId) {
    throw new Error("Book ID is required");
  }

  return await UploadJob.find({ bookId }).sort({ createdAt: -1 });
};

// --- Reading & Translation Pipeline Features ---

export const createBookBlock = async ({
  chapterId,
  blockNumber,
  englishText,
}) => {
  const bookBlock = await BookBlock.create({
    chapterId,
    blockNumber,
    englishText,
  });

  if (typeof addTranslationJob === "function") {
    try {
      await addTranslationJob({
        blockId: bookBlock._id,
        englishText: bookBlock.englishText,
      });
    } catch {
      // Background worker translation error shouldn't fail block creation
    }
  }

  return bookBlock;
};

export const getBookReader = async (bookId) => {
  const book = await Book.findById(bookId).lean();

  if (!book) {
    throw new Error("Book not found");
  }

  const chapters = await Chapter.find({ bookId })
    .sort({ chapterNumber: 1 })
    .lean();

  const chapterIds = chapters.map((chapter) => chapter._id);

  const blocks = await BookBlock.find({
    chapterId: { $in: chapterIds },
  })
    .sort({ chapterId: 1, blockNumber: 1 })
    .lean();

  return {
    book,
    chapters,
    blocks,
  };
};

export const getReadingProgress = async (userId, bookId) => {
  const progress = await ReadingProgress.findOne({
    userId,
    bookId,
  }).lean();

  return progress;
};

export const saveReadingProgress = async ({
  userId,
  bookId,
  chapterId,
  blockNumber,
  scrollPosition,
  language,
  fontSize,
  theme,
}) => {
  const progress = await ReadingProgress.findOneAndUpdate(
    {
      userId,
      bookId,
    },
    {
      $set: {
        chapterId,
        blockNumber,
        scrollPosition,
        language,
        fontSize,
        theme,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  ).lean();

  return progress;
};
