import {
  generateChatMediaPresignedUploadUrl,
  CHAT_MEDIA_TYPE,
} from "../services/r2.service.js";

export const getChatMediaPresignedUploadController = async (req, res) => {
  try {
    const rawFileName = req.body?.fileName;
    const rawContentType = req.body?.contentType;
    const rawSize = req.body?.size;
    const rawMediaType = req.body?.mediaType;

    const fileName = typeof rawFileName === "string" ? rawFileName.trim() : "";
    const contentType = typeof rawContentType === "string" ? rawContentType.trim() : "";
    const size = typeof rawSize === "number" ? rawSize : Number(rawSize);
    const mediaType = typeof rawMediaType === "string" ? rawMediaType.trim() : "";

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "fileName is required",
      });
    }

    if (!contentType) {
      return res.status(400).json({
        success: false,
        message: "contentType is required",
      });
    }

    if (!Number.isFinite(size) || size <= 0) {
      return res.status(400).json({
        success: false,
        message: "size must be a positive number",
      });
    }

    if (!mediaType || !Object.values(CHAT_MEDIA_TYPE).includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mediaType. Allowed: IMAGE, PDF, VOICE",
      });
    }

    const result = await generateChatMediaPresignedUploadUrl({
      fileName,
      contentType,
      size,
      mediaType,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get chat media presigned upload error:", error);

    const message = error?.message || "Failed to generate presigned upload URL";

    const isValidationError =
      message.includes("Invalid") ||
      message.includes("exceeds limit") ||
      message.includes("required") ||
      message.includes("positive number");

    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message,
    });
  }
};
