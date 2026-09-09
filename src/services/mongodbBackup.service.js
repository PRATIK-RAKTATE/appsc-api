import { execFile } from "node:child_process";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
} from "node:fs";
import {
  appendFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import { uploadFileToR2 } from "./r2.service.js";

const execFileAsync = promisify(execFile);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

const getEncryptionKey = () => {
  const value = process.env.BACKUP_ENCRYPTION_KEY;

  if (!value) {
    throw new Error("BACKUP_ENCRYPTION_KEY is not configured");
  }

  if (!/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      "BACKUP_ENCRYPTION_KEY must be a 64-character hexadecimal string"
    );
  }

  return Buffer.from(value, "hex");
};

const getMongoDumpPath = () => {
  return process.env.MONGODUMP_PATH || "mongodump";
};

const getBackupDirectory = () => {
  return path.resolve(
    process.env.BACKUP_TEMP_DIR || "tmp/mongodb-backups"
  );
};

const createBackupFileName = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

  return `mongodb-backup-${timestamp}.archive.gz`;
};

const runMongoDump = async (archivePath) => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  const mongodumpPath = getMongoDumpPath();

  await execFileAsync(mongodumpPath, [
    `--uri=${process.env.MONGODB_URI}`,
    `--archive=${archivePath}`,
    "--gzip",
  ]);
};

const encryptBackup = async (sourcePath, encryptedPath) => {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  await writeFile(encryptedPath, iv);

  await pipeline(
    createReadStream(sourcePath),
    cipher,
    createWriteStream(encryptedPath, {
      flags: "a",
    })
  );

  const authTag = cipher.getAuthTag();

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid AES-GCM authentication tag");
  }

  await appendFile(encryptedPath, authTag);
};

const createR2Key = (fileName) => {
  const now = new Date();

  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  return `backups/mongodb/${year}/${month}/${day}/${fileName}`;
};

export const createMongoDBBackup = async () => {
  const backupDirectory = getBackupDirectory();

  await mkdir(backupDirectory, {
    recursive: true,
  });

  const fileName = createBackupFileName();

  const archivePath = path.join(
    backupDirectory,
    fileName
  );

  const encryptedFileName = `${fileName}.enc`;

  const encryptedPath = path.join(
    backupDirectory,
    encryptedFileName
  );

  try {
    console.log("Starting MongoDB backup...");

    await runMongoDump(archivePath);

    console.log("MongoDB dump completed");

    await encryptBackup(
      archivePath,
      encryptedPath
    );

    console.log("MongoDB backup encrypted");

    const fileStats = await stat(encryptedPath);

    const r2Key = createR2Key(
      encryptedFileName
    );

    await uploadFileToR2({
      key: r2Key,
      body: createReadStream(encryptedPath),
      contentType: "application/octet-stream",
      contentLength: fileStats.size,
    });

    console.log("Encrypted backup uploaded to R2");

    return {
      success: true,
      key: r2Key,
      size: fileStats.size,
    };
  } finally {
    await rm(archivePath, {
      force: true,
    });

    await rm(encryptedPath, {
      force: true,
    });
  }
};

export const decryptMongoDBBackup = async (
  encryptedPath,
  outputPath
) => {
  const key = getEncryptionKey();

  const encryptedData = await readFile(
    encryptedPath
  );

  if (
    encryptedData.length <=
    IV_LENGTH + AUTH_TAG_LENGTH
  ) {
    throw new Error("Invalid encrypted backup file");
  }

  const iv = encryptedData.subarray(
    0,
    IV_LENGTH
  );

  const authTag = encryptedData.subarray(
    encryptedData.length - AUTH_TAG_LENGTH
  );

  const ciphertext = encryptedData.subarray(
    IV_LENGTH,
    encryptedData.length - AUTH_TAG_LENGTH
  );

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  await writeFile(outputPath, plaintext);

  return outputPath;
};

export const BACKUP_CONSTANTS = {
  ALGORITHM,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
  KEY_LENGTH,
};