import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getR2Endpoint = () => {
  if (process.env.R2_ENDPOINT) {
    return process.env.R2_ENDPOINT;
  }
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  return undefined;
};

export const r2Client = new S3Client({
  region: "auto",
  endpoint: getR2Endpoint(),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
export const R2_SIGNED_URL_EXPIRY_SECONDS =
  Number(process.env.R2_SIGNED_URL_EXPIRY_SECONDS) || 900;

/**
 * Generate a presigned URL for direct client upload (PUT) to Cloudflare R2.
 */
export const generatePresignedUploadUrl = async (
  keyOrOptions,
  optionalContentType,
  optionalExpiresIn
) => {
  const bucket = process.env.R2_BUCKET_NAME || R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  let key;
  let contentType = "application/octet-stream";
  let expiresIn = R2_SIGNED_URL_EXPIRY_SECONDS;

  if (typeof keyOrOptions === "object" && keyOrOptions !== null) {
    key = keyOrOptions.key;
    if (keyOrOptions.contentType) contentType = keyOrOptions.contentType;
    if (keyOrOptions.expiresIn !== undefined) expiresIn = keyOrOptions.expiresIn;
  } else {
    key = keyOrOptions;
    if (optionalContentType) contentType = optionalContentType;
    if (optionalExpiresIn !== undefined) expiresIn = optionalExpiresIn;
  }

  if (!key) {
    throw new Error("R2 object key is required");
  }

  const parsedExpiry = Number(expiresIn);
  if (!Number.isInteger(parsedExpiry) || parsedExpiry <= 0 || parsedExpiry > 86400) {
    throw new Error("expiresIn must be a positive number up to 86400 seconds");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: parsedExpiry });
};

/**
 * Generate a signed GET URL for downloading/viewing a file from R2.
 */
export const generateSignedUrl = async (
  key,
  expiresIn = R2_SIGNED_URL_EXPIRY_SECONDS
) => {
  const bucket = process.env.R2_BUCKET_NAME || R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  if (!key) {
    throw new Error("R2 object key is required");
  }

  const parsedExpiry = Number(expiresIn);
  if (!Number.isInteger(parsedExpiry) || parsedExpiry <= 0 || parsedExpiry > 86400) {
    throw new Error("expiresIn must be a positive number up to 86400 seconds");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn: parsedExpiry });
};

/**
 * Directly upload a file buffer or stream to R2 from the server.
 */
export const uploadFileToR2 = async ({
  key,
  body,
  contentType = "application/octet-stream",
  contentLength,
}) => {
  const bucket = process.env.R2_BUCKET_NAME || R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  if (!key) {
    throw new Error("R2 object key is required");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ...(contentLength !== undefined ? { ContentLength: contentLength } : {}),
  });

  return await r2Client.send(command);
};

/**
 * Delete an object from R2.
 */
export const deleteFileFromR2 = async (key) => {
  const bucket = process.env.R2_BUCKET_NAME || R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  if (!key) {
    throw new Error("R2 object key is required");
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await r2Client.send(command);
};

/**
 * Build the URL to an R2 object.
 */
export const getFileUrl = (key) => {
  if (!key) return "";
  if (process.env.R2_PUBLIC_DOMAIN) {
    return `${process.env.R2_PUBLIC_DOMAIN.replace(/\/$/, "")}/${key}`;
  }
  const endpoint = getR2Endpoint() || "";
  const bucket = process.env.R2_BUCKET_NAME || R2_BUCKET_NAME || "";
  return `${endpoint}/${bucket}/${key}`;
};

export const CHAT_MEDIA_TYPE = {
  IMAGE: "IMAGE",
  PDF: "PDF",
  VOICE: "VOICE",
};

export const CHAT_MEDIA_ALLOWED_MIME_TYPES = {
  [CHAT_MEDIA_TYPE.IMAGE]: new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
  ]),
  [CHAT_MEDIA_TYPE.PDF]: new Set(["application/pdf"]),
  [CHAT_MEDIA_TYPE.VOICE]: new Set([
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/flac",
    "audio/x-m4a",
  ]),
};

export const CHAT_MEDIA_MAX_SIZE_BYTES = {
  [CHAT_MEDIA_TYPE.IMAGE]: 5 * 1024 * 1024,
  [CHAT_MEDIA_TYPE.PDF]: 10 * 1024 * 1024,
  [CHAT_MEDIA_TYPE.VOICE]: 5 * 1024 * 1024,
};

export const generateChatMediaPresignedUploadUrl = async ({
  fileName,
  contentType,
  size,
  mediaType,
}) => {
  const bucket = process.env.R2_BUCKET_NAME || R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  if (!mediaType || !Object.values(CHAT_MEDIA_TYPE).includes(mediaType)) {
    throw new Error("Invalid mediaType. Allowed: IMAGE, PDF, VOICE");
  }

  const trimmedContentType = typeof contentType === "string" ? contentType.trim() : "";
  const allowedMimes = CHAT_MEDIA_ALLOWED_MIME_TYPES[mediaType];
  if (!trimmedContentType || !allowedMimes.has(trimmedContentType.toLowerCase())) {
    throw new Error(
      `Invalid contentType for ${mediaType}. Allowed: ${Array.from(allowedMimes).join(", ")}`
    );
  }

  const maxSize = CHAT_MEDIA_MAX_SIZE_BYTES[mediaType];
  if (typeof size !== "number" || size <= 0 || !Number.isFinite(size)) {
    throw new Error("File size must be a positive number");
  }
  if (size > maxSize) {
    throw new Error(
      `File size exceeds limit for ${mediaType}. Max allowed: ${maxSize} bytes`
    );
  }

  const rawName = typeof fileName === "string" ? fileName.trim() : "";
  if (!rawName) {
    throw new Error("fileName is required");
  }

  const cleanName = rawName.replace(/[^a-zA-Z0-9_.-]/g, "_").substring(0, 100);
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const key = `chat-media/${mediaType.toLowerCase()}/${uniqueId}-${cleanName}`;

  const uploadUrl = await generatePresignedUploadUrl({
    key,
    contentType: trimmedContentType,
  });

  return {
    uploadUrl,
    key,
    contentType: trimmedContentType,
    expiresIn: R2_SIGNED_URL_EXPIRY_SECONDS,
    maxSize,
    mediaType,
  };
};
