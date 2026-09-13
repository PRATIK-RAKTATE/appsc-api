import { Router } from "express";

import {
  createTestController,
  getTestsController,
  getTestByIdController,
  updateTestController,
  deleteTestController,
} from "../controllers/test.controller.js";

const router = Router();

router.post("/", createTestController);
router.get("/", getTestsController);
router.get("/:id", getTestByIdController);
router.patch("/:id", updateTestController);
router.delete("/:id", deleteTestController);

export default router;