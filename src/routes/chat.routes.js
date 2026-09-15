import express from "express";
import { reportMessage } from "../controllers/chatModeration.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Authenticated users (Students, Mentors) can report messages
router.use(verifyToken);

// Report endpoints
router.post("/reports", reportMessage);
router.post("/messages/:messageId/report", reportMessage);

export default router;
