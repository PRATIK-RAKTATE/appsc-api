import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { randomBytes, createCipheriv } from "node:crypto";
import { writeFile, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import {
  BACKUP_CONSTANTS,
  decryptMongoDBBackup,
} from "../services/mongodbBackup.service.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const setEnv = (vars) => {
  const originals = {};

  for (const [k, v] of Object.entries(vars)) {
    originals[k] = process.env[k];

    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }

  return () => {
    for (const [k, v] of Object.entries(originals)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  };
};

/** Generate a valid 64-char hex key. */
const makeKey = () => randomBytes(32).toString("hex");

/**
 * Build an AES-256-GCM encrypted blob in the same format used by encryptBackup:
 * IV(12) || ciphertext || authTag(16)
 */
const encryptBlob = (plaintext, keyHex) => {
  const key = Buffer.from(keyHex, "hex");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, ciphertext, authTag]);
};

// ── constants ─────────────────────────────────────────────────────────────────

describe("MongoDB Backup Service – constants", () => {
  it("uses AES-256-GCM encryption", () => {
    expect(BACKUP_CONSTANTS.ALGORITHM).toBe("aes-256-gcm");
  });

  it("uses a 12-byte initialization vector", () => {
    expect(BACKUP_CONSTANTS.IV_LENGTH).toBe(12);
  });

  it("uses a 16-byte authentication tag", () => {
    expect(BACKUP_CONSTANTS.AUTH_TAG_LENGTH).toBe(16);
  });

  it("uses a 32-byte encryption key", () => {
    expect(BACKUP_CONSTANTS.KEY_LENGTH).toBe(32);
  });
});

// ── decryptMongoDBBackup – round-trip ─────────────────────────────────────────

describe("MongoDB Backup Service – decryptMongoDBBackup", () => {
  let tmpDir;
  let keyHex;
  let restore;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `backup-test-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });

    keyHex = makeKey();
    restore = setEnv({ BACKUP_ENCRYPTION_KEY: keyHex });
  });

  afterEach(async () => {
    restore();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("decrypts data that was encrypted with the same key", async () => {
    const plaintext = Buffer.from("fake-archive-content-for-testing");
    const encryptedBlob = encryptBlob(plaintext, keyHex);

    const encryptedPath = path.join(tmpDir, "backup.gz.enc");
    const outputPath = path.join(tmpDir, "backup.gz");

    await writeFile(encryptedPath, encryptedBlob);

    await decryptMongoDBBackup(encryptedPath, outputPath);

    const { readFile } = await import("node:fs/promises");
    const result = await readFile(outputPath);

    expect(result.toString()).toBe(plaintext.toString());
  });

  it("returns the output path on success", async () => {
    const plaintext = Buffer.from("archive");
    const encryptedBlob = encryptBlob(plaintext, keyHex);

    const encryptedPath = path.join(tmpDir, "backup2.gz.enc");
    const outputPath = path.join(tmpDir, "backup2.gz");

    await writeFile(encryptedPath, encryptedBlob);

    const result = await decryptMongoDBBackup(encryptedPath, outputPath);

    expect(result).toBe(outputPath);
  });

  it("throws when the encrypted file is too short to contain IV + authTag", async () => {
    const tooShort = path.join(tmpDir, "tiny.enc");
    // 12 (IV) + 16 (authTag) = 28 bytes minimum; write only 10
    await writeFile(tooShort, Buffer.alloc(10));

    await expect(
      decryptMongoDBBackup(tooShort, path.join(tmpDir, "out"))
    ).rejects.toThrow("Invalid encrypted backup file");
  });

  it("throws when BACKUP_ENCRYPTION_KEY is not set", async () => {
    restore();
    restore = setEnv({ BACKUP_ENCRYPTION_KEY: undefined });

    const dummyPath = path.join(tmpDir, "dummy.enc");
    await writeFile(dummyPath, Buffer.alloc(50));

    await expect(
      decryptMongoDBBackup(dummyPath, path.join(tmpDir, "out2"))
    ).rejects.toThrow("BACKUP_ENCRYPTION_KEY is not configured");
  });

  it("throws when BACKUP_ENCRYPTION_KEY is not a valid 64-char hex string", async () => {
    restore();
    restore = setEnv({ BACKUP_ENCRYPTION_KEY: "not-hex" });

    const dummyPath = path.join(tmpDir, "dummy2.enc");
    await writeFile(dummyPath, Buffer.alloc(50));

    await expect(
      decryptMongoDBBackup(dummyPath, path.join(tmpDir, "out3"))
    ).rejects.toThrow(
      "BACKUP_ENCRYPTION_KEY must be a 64-character hexadecimal string"
    );
  });

  it("throws when BACKUP_ENCRYPTION_KEY is valid hex but wrong length (< 64 chars)", async () => {
    restore();
    // 32-char hex = 16 bytes, not 32
    restore = setEnv({ BACKUP_ENCRYPTION_KEY: randomBytes(16).toString("hex") });

    const dummyPath = path.join(tmpDir, "dummy3.enc");
    await writeFile(dummyPath, Buffer.alloc(50));

    await expect(
      decryptMongoDBBackup(dummyPath, path.join(tmpDir, "out4"))
    ).rejects.toThrow(
      "BACKUP_ENCRYPTION_KEY must be a 64-character hexadecimal string"
    );
  });
});