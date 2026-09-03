import express from "express";

import {
  createBookBlockController,
} from "../controllers/book.controller.js";

const router = express.Router();

router.post("/book-blocks", createBookBlockController);

export default router;