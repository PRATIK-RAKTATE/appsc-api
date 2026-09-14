import express from "express";
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
  createBookBlockController,
  getBookReaderController,
  getReadingProgressController,
  saveReadingProgressController,
  searchBookBlocksController,
} from "../controllers/book.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// Translation / Book blocks endpoint
router.post("/book-blocks", createBookBlockController);

// Upload job status (placed before /:id to avoid route conflict)
router.get(
  "/upload-jobs/:jobId",
  verifyToken,
  requireRole("ADMIN"),
  getUploadJobController
);

// Presigned upload URL endpoints
router.post(
  "/upload-url",
  verifyToken,
  requireRole("ADMIN"),
  getPresignedUploadController
);

router.post(
  "/:id/upload-url",
  verifyToken,
  requireRole("ADMIN"),
  getPresignedUploadController
);

// Confirm / fail direct upload
router.post(
  "/confirm-upload",
  verifyToken,
  requireRole("ADMIN"),
  confirmUploadController
);

router.post(
  "/:id/confirm-upload",
  verifyToken,
  requireRole("ADMIN"),
  confirmUploadController
);

router.post(
  "/:id/fail-upload",
  verifyToken,
  requireRole("ADMIN"),
  failUploadController
);

// List and view upload jobs for a book
router.get(
  "/:id/upload-jobs",
  verifyToken,
  requireRole("ADMIN"),
  getBookUploadJobsController
);

// Reading progress and reader endpoints
router.get(
  "/:bookId/reader",
  verifyToken,
  getBookReaderController
);

router.get(
  "/:bookId/progress",
  verifyToken,
  getReadingProgressController
);

router.put(
  "/:bookId/progress",
  verifyToken,
  saveReadingProgressController
);

router.get(
  "/:bookId/search",
  verifyToken,
  searchBookBlocksController
);

// Book CRUD operations
router.post(
  "/",
  verifyToken,
  requireRole("ADMIN"),
  createBookController
);

router.get(
  "/",
  verifyToken,
  listBooksController
);

router.get(
  "/:id",
  verifyToken,
  getBookByIdController
);

router.put(
  "/:id",
  verifyToken,
  requireRole("ADMIN"),
  updateBookController
);

router.patch(
  "/:id",
  verifyToken,
  requireRole("ADMIN"),
  updateBookController
);

router.delete(
  "/:id",
  verifyToken,
  requireRole("ADMIN"),
  deleteBookController
);

export default router;
