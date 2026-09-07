import express from "express";

import {
  createQuestionController,
  getQuestionsController,
  getQuestionByIdController,
  updateQuestionController,
  deleteQuestionController,
} from "../controllers/question.controller.js";

const router = express.Router();

router.post("/", createQuestionController);
router.get("/", getQuestionsController);
router.get("/:id", getQuestionByIdController);
router.patch("/:id", updateQuestionController);
router.delete("/:id", deleteQuestionController);

export default router;
