import express from "express";
import {
  applyForMentor,
  browseMentors,
  connectWithMentor,
} from "../controllers/mentor.controller.js";
import { verifyToken } from "../../auth/index.js";

const router = express.Router();

// Public / student-accessible directory of approved mentors
router.get("/", browseMentors);

// Authenticated routes
router.post("/apply", verifyToken, applyForMentor);
router.post("/:id/connect", verifyToken, connectWithMentor);

export default router;
