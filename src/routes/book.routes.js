import express from "express";

import {
  createBookBlockController,
  getBookReaderController,
  getReadingProgressController,
  saveReadingProgressController,
} from "../controllers/book.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/book-blocks", createBookBlockController);

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

export default router;