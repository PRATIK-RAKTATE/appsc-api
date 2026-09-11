import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  r2Client,
  R2_BUCKET_NAME,
  R2_SIGNED_URL_EXPIRY_SECONDS,
} from "../config/r2.js";

export { r2Client, R2_BUCKET_NAME, R2_SIGNED_URL_EXPIRY_SECONDS };

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
    ...(contentLength !== undefined
      ? { ContentLength: contentLength }
      : {}),
  });

  return await r2Client.send(command);
};

export const generateSignedUrl = async (key, expiresIn = R2_SIGNED_URL_EXPIRY_SECONDS) => {
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