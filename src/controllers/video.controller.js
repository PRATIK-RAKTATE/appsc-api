import {
  uploadFileToR2,
  generateSignedUrl,
  R2_SIGNED_URL_EXPIRY_SECONDS,
} from "../services/r2.service.js";
import { assertVideoAccess } from "../services/video.service.js";

export const uploadVideoController = async (req, res) => {
  try {
    const { title } = req.body || {};
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "Video file is required" });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const timestamp = Date.now();
    const sanitizedTitle = title.trim().replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
    const safeFileName = (file.originalname || "video.mp4").replace(/[^a-zA-Z0-9_.-]/g, "_");
    const r2Key = `videos/${timestamp}-${sanitizedTitle}-${safeFileName}`;

    await uploadFileToR2({
      key: r2Key,
      body: file.buffer,
      contentType: file.mimetype,
      contentLength: file.size,
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: {
        r2Key,
        title: title.trim(),
        contentType: file.mimetype,
        size: file.size,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVideoSignedUrlController = async (req, res) => {
  try {
    let rawKey = req.query?.r2Key;
    if (!rawKey && req.params?.r2Key) {
      rawKey = Array.isArray(req.params.r2Key)
        ? req.params.r2Key.join("/")
        : req.params.r2Key;
    }
    if (!rawKey && req.params?.[0]) {
      rawKey = req.params[0];
    }

    if (!rawKey || (typeof rawKey === "string" && !rawKey.trim())) {
      return res.status(400).json({ success: false, message: "r2Key is required" });
    }

    let decodedKey;
    try {
      decodedKey = decodeURIComponent(String(rawKey).trim());
    } catch {
      decodedKey = String(rawKey).trim();
    }

    const r2Key = decodedKey.replace(/^\/+/, "");
    if (!r2Key) {
      return res.status(400).json({ success: false, message: "r2Key is required" });
    }

    const { expiresIn } = req.query || {};
    let expiry = R2_SIGNED_URL_EXPIRY_SECONDS;

    if (expiresIn !== undefined) {
      const parsed = Number(expiresIn);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 86400) {
        return res.status(400).json({
          success: false,
          message: "expiresIn must be a positive number up to 86400 seconds",
        });
      }
      expiry = parsed;
    }

    if (req.user?.role) {
      await assertVideoAccess(req.user.userId, r2Key, req.user.role);
    } else {
      await assertVideoAccess(req.user?.userId || req.user, r2Key);
    }

    const signedUrl = await generateSignedUrl(r2Key, expiry);

    return res.status(200).json({
      success: true,
      message: "Signed URL generated successfully",
      data: {
        signedUrl,
        expiresIn: expiry,
      },
    });
  } catch (error) {
    const statusCode =
      error.statusCode ||
      (error.message === "You do not have access to this video" || error.message === "Video not found"
        ? 404
        : 500);

    return res.status(statusCode).json({ success: false, message: error.message });
  }
};
