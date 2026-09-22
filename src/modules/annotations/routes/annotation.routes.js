import express from "express";
import {
  createAnnotation,
  getBookAnnotations,
  updateAnnotation,
  deleteAnnotation
} from "../controllers/annotation.controller.js";
import { verifyToken } from "../../auth/index.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createAnnotation);
router.get("/book/:bookId", getBookAnnotations);
router.patch("/:id", updateAnnotation);
router.delete("/:id", deleteAnnotation);

export default router;

