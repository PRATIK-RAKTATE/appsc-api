import express from "express";
import {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  updateCurriculum,
  updateCourseStatus,
  deleteCourse,
} from "../controllers/course.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(verifyToken, requireRole("ADMIN"));

router.route("/")
  .post(createCourse)
  .get(getCourses);

router.route("/:id")
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

router.put("/:id/curriculum", updateCurriculum);
router.patch("/:id/status", updateCourseStatus);

export default router;

