import express from "express";
import {
  createSubjectController,
  getSubjectByIdController,
  getSubjectsController,
  updateSubjectController,
  deleteSubjectController,
} from "../controllers/subject.controller.js";

const router = express.Router();

router.post("/", createSubjectController);
router.get("/", getSubjectsController);
router.get("/:id", getSubjectByIdController);
router.patch("/:id", updateSubjectController);
router.delete("/:id", deleteSubjectController);

export default router;