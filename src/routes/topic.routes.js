import express from "express";
import {
  createTopicController,
  getTopicsController,
  getTopicByIdController,
  updateTopicController,
  deleteTopicController,
} from "../controllers/topic.controller.js";

const router = express.Router();

router.post("/", createTopicController);
router.get("/", getTopicsController);
router.get("/:id", getTopicByIdController);
router.patch("/:id", updateTopicController);
router.delete("/:id", deleteTopicController);

export default router;