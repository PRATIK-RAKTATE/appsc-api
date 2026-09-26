import express from "express";

import {
  createSubTopicController,
  getSubTopicsController,
  getSubTopicByIdController,
  updateSubTopicController,
  deleteSubTopicController,
} from "../controllers/subTopic.controller.js";

const router = express.Router();

router.post("/", createSubTopicController);
router.get("/", getSubTopicsController);
router.get("/:id", getSubTopicByIdController);
router.patch("/:id", updateSubTopicController);
router.delete("/:id", deleteSubTopicController);

export default router;
