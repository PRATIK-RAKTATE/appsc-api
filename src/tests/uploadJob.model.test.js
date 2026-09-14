import { describe, it, expect } from "vitest";
import {
  UploadJob,
  UPLOAD_JOB_STATUS,
} from "../models/uploadJob.model.js";

describe("UploadJob Model", () => {
  const validJob = {
    bookId: "507f1f77bcf86cd799439011",
    fileKey: "books/507f1f77bcf86cd799439011/test.pdf",
    fileName: "test.pdf",
    mimeType: "application/pdf",
    uploadedBy: "507f1f77bcf86cd799439012",
  };

  it("should create a valid upload job with default PENDING status", async () => {
    const job = new UploadJob(validJob);

    await expect(job.validate()).resolves.toBeUndefined();
    expect(job.status).toBe(UPLOAD_JOB_STATUS.PENDING);
  });

  it("should require bookId", async () => {
    const job = new UploadJob({
      ...validJob,
      bookId: undefined,
    });

    await expect(job.validate()).rejects.toThrow();
  });

  it("should require fileKey", async () => {
    const job = new UploadJob({
      ...validJob,
      fileKey: undefined,
    });

    await expect(job.validate()).rejects.toThrow();
  });

  it("should require fileName", async () => {
    const job = new UploadJob({
      ...validJob,
      fileName: undefined,
    });

    await expect(job.validate()).rejects.toThrow();
  });

  it("should require mimeType", async () => {
    const job = new UploadJob({
      ...validJob,
      mimeType: undefined,
    });

    await expect(job.validate()).rejects.toThrow();
  });

  it("should require uploadedBy", async () => {
    const job = new UploadJob({
      ...validJob,
      uploadedBy: undefined,
    });

    await expect(job.validate()).rejects.toThrow();
  });

  it("should reject invalid status", async () => {
    const job = new UploadJob({
      ...validJob,
      status: "INVALID_STATUS",
    });

    await expect(job.validate()).rejects.toThrow();
  });
});
