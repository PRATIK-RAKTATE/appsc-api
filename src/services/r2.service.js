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

export const generateSignedUrl = async (key, expiresIn = R2_SIGNED_URL_EXPIRY_SECONDS) => {
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

  const parsedExpiry = Number(expiresIn);
  if (!Number.isInteger(parsedExpiry) || parsedExpiry <= 0 || parsedExpiry > 86400) {
    throw new Error("expiresIn must be a positive number up to 86400 seconds");
  }

  const command = new GetObjectCommand({
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
