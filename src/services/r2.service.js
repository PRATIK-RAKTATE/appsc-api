import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const requiredEnv = [
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`${key} is not configured`);
  }
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export const uploadFileToR2 = async ({
  key,
  body,
  contentType = "application/octet-stream",
  contentLength,
}) => {
  if (!R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    ...(contentLength !== undefined
      ? { ContentLength: contentLength }
      : {}),
  });

  return await r2Client.send(command);
};