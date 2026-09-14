import express from "express";
import { uploadVideoController, getVideoSignedUrlController } from "../controllers/video.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

router.post(
  "/upload",
  verifyToken,
  requireRole("ADMIN", "MENTOR"),
  uploadMiddleware.single("video"),
  uploadVideoController
);

router.get("/signed-url", verifyToken, getVideoSignedUrlController);
router.get("/signed-url/*r2Key", verifyToken, getVideoSignedUrlController);


router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File size exceeds maximum limit of 500MB" });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.message === "Only video files are allowed") {
    return res.status(400).json({ success: false, message: "Only video files are allowed" });
  }
  return res.status(500).json({ success: false, message: err.message });
});

export default router;
