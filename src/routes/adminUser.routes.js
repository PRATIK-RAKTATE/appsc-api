import express from "express";
import {
  getUsers,
  getUserDetail,
  updateUserStatus,
  revokeUserSessions
} from "../controllers/adminUser.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import { USER_ROLES } from "../models/user.model.js";

const router = express.Router();

router.use(verifyToken, requireRole(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN));

router.get("/", getUsers);
router.get("/:id", getUserDetail);
router.patch("/:id/status", updateUserStatus);
router.post("/:id/revoke-sessions", revokeUserSessions);

export default router;

