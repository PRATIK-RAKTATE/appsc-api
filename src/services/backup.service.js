import { execFile } from "child_process";
import { promisify } from "util";
import { createCipheriv, randomBytes } from "crypto";
import {
  createReadStream,
  createWriteStream,
  promises as fs,
} from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "../config/r2.js";

const execFileAsync = promisify(execFile);

const BACKUP_DIR = path.resolve("backups");

const encryptFile = async (inputPath, outputPath) => {
  const key = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY, "hex");

  if (key.length !== 32) {
    throw new Error(
      "BACKUP_ENCRYPTION_KEY must be a 32-byte hex key"
    );
  }

  const iv = randomBytes(16);

  const cipher = createCipheriv("aes-256-cbc", key, iv);

  await fs.writeFile(`${outputPath}.iv`, iv);

  await pipeline(
    createReadStream(inputPath),
    cipher,
    createWriteStream(outputPath)
  );
};

const createMongoDump = async (outputPath) => {
  await execFileAsync("mongodump", [
    `--uri=${process.env.MONGODB_URI}`,
    `--archive=${outputPath}`,
  ]);
};

export const createAndUploadMongoBackup = async () => {
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  const dumpPath = path.join(
    BACKUP_DIR,
    `mongodb-${timestamp}.archive`
  );

  const encryptedPath = `${dumpPath}.enc`;

  try {
    await createMongoDump(dumpPath);

    await encryptFile(dumpPath, encryptedPath);

    const objectKey = `mongodb-backups/${path.basename(
      encryptedPath
    )}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: createReadStream(encryptedPath),
        ContentType: "application/octet-stream",
      })
    );

    return {
      success: true,
      key: objectKey,
    };
  } finally {
    await fs.rm(dumpPath, { force: true });
    await fs.rm(encryptedPath, { force: true });
    await fs.rm(`${encryptedPath}.iv`, { force: true });
  }
};