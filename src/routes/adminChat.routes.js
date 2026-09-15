import express from "express";
import {
  getReports,
  getReportById,
  resolveReport,
  getAuditLogs,
  getThreads,
  getThreadTranscript,
  searchAuditMessages,
} from "../controllers/chatModeration.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import { USER_ROLES } from "../models/user.model.js";

const router = express.Router();

// Admin-only endpoints
router.use(verifyToken, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN));

// Report management & moderation panel
router.get("/reports", getReports);
router.get("/reports/:id", getReportById);
router.patch("/reports/:id", resolveReport);
router.post("/reports/:id/resolve", resolveReport);

// Moderation / Audit logs
router.get("/audit-logs", getAuditLogs);
router.get("/moderation-logs", getAuditLogs);

// Chat audit archive & transcripts
router.get("/threads", getThreads);
router.get("/threads/:threadId/transcript", getThreadTranscript);
router.get("/transcripts/:threadId", getThreadTranscript);
router.get("/messages/search", searchAuditMessages);

export default router;
