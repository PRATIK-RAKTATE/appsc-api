import express from "express";
import { reportMessage } from "../controllers/chatModeration.controller.js";
import {
  getUserThreadsController,
  createOrGetThreadController,
  getThreadMessagesController,
  getUnreadCountController,
} from "../controllers/chat.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/threads", getUserThreadsController);
router.post("/threads", createOrGetThreadController);
router.get("/threads/:threadId/messages", getThreadMessagesController);

router.get("/unread-count", getUnreadCountController);

router.post("/reports", reportMessage);
router.post("/messages/:messageId/report", reportMessage);

export default router;

