import express from "express";
import {
  listMentorApplications,
  updateMentorStatus,
} from "../controllers/adminMentor.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import { USER_ROLES } from "../models/user.model.js";

const router = express.Router();

// All routes require admin (or super-admin) authentication
router.use(verifyToken, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN));

router.get("/", listMentorApplications);
router.patch("/:id/status", updateMentorStatus);

export default router;
