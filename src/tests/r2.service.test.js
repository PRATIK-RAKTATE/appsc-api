import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSend = vi.fn();
const MockS3Client = vi.fn(function S3Client() {
  this.send = mockSend;
});

const mockGetSignedUrl = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: MockS3Client,
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

process.env.R2_BUCKET_NAME = "test-bucket";
process.env.R2_ENDPOINT = "https://test.r2.cloudflarestorage.com";
process.env.R2_ACCESS_KEY_ID = "test-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_SIGNED_URL_EXPIRY_SECONDS = "3600";

const { uploadFileToR2, generateSignedUrl, R2_SIGNED_URL_EXPIRY_SECONDS } = await import("../services/r2.service.js");
const { PutObjectCommand, GetObjectCommand } = await import("@aws-sdk/client-s3");

describe("R2 service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue("https://signed-url.example.com/video.mp4");
  });

  describe("uploadFileToR2", () => {
    it("uploads a file to R2 with default content type", async () => {
      const body = Buffer.from("video content");
      const result = await uploadFileToR2({
        key: "videos/test.mp4",
        body,
      });

      expect(result).toEqual({});
      expect(PutObjectCommand).toHaveBeenCalledOnce();
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "videos/test.mp4",
        Body: body,
        ContentType: "application/octet-stream",
      });
      expect(mockSend).toHaveBeenCalledOnce();
    });

    it("uploads a file with explicit content type and length", async () => {
      const body = Buffer.from("video content");
      await uploadFileToR2({
        key: "videos/test.mp4",
        body,
        contentType: "video/mp4",
        contentLength: 1024,
      });

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "videos/test.mp4",
        Body: body,
        ContentType: "video/mp4",
        ContentLength: 1024,
      });
      expect(mockSend).toHaveBeenCalledOnce();
    });

    it("uploads a file with nested key containing multiple slashes", async () => {
      const body = Buffer.from("video content");
      await uploadFileToR2({
        key: "courses/2026/09/module-1/lesson-1.mp4",
        body,
        contentType: "video/mp4",
        contentLength: 2048,
      });

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "courses/2026/09/module-1/lesson-1.mp4",
        Body: body,
        ContentType: "video/mp4",
        ContentLength: 2048,
      });
    });

    it("throws when key is missing in uploadFileToR2", async () => {
      await expect(uploadFileToR2({ key: "", body: Buffer.from("x") })).rejects.toThrow("R2 object key is required");
      await expect(uploadFileToR2({ key: undefined, body: Buffer.from("x") })).rejects.toThrow("R2 object key is required");
    });

    it("throws when R2_BUCKET_NAME is not configured", async () => {
      const originalValue = process.env.R2_BUCKET_NAME;
      delete process.env.R2_BUCKET_NAME;

      vi.resetModules();
      const { uploadFileToR2: uploadWithoutBucket } = await import("../services/r2.service.js");

      await expect(uploadWithoutBucket({ key: "test", body: Buffer.from("x") })).rejects.toThrow("R2_BUCKET_NAME is not configured");

      process.env.R2_BUCKET_NAME = originalValue;
    });
  });

  describe("generateSignedUrl", () => {
    it("generates a signed URL with default expiry", async () => {
      const result = await generateSignedUrl("videos/test.mp4");

      expect(result).toBe("https://signed-url.example.com/video.mp4");
      expect(GetObjectCommand).toHaveBeenCalledOnce();
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "videos/test.mp4",
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 3600 });
    });

    it("generates a signed URL for keys containing multiple slashes", async () => {
      const nestedKey = "courses/batch-1/module-2/videos/lecture.mp4";
      const result = await generateSignedUrl(nestedKey, 1800);

      expect(result).toBe("https://signed-url.example.com/video.mp4");
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: nestedKey,
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 1800 });
    });

    it("generates a signed URL with custom expiry", async () => {
      const result = await generateSignedUrl("videos/test.mp4", 1800);

      expect(result).toBe("https://signed-url.example.com/video.mp4");
      expect(GetObjectCommand).toHaveBeenCalledOnce();
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "videos/test.mp4",
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), { expiresIn: 1800 });
    });

    it("rejects invalid expiry values", async () => {
      await expect(generateSignedUrl("videos/test.mp4", 0)).rejects.toThrow("expiresIn must be a positive number up to 86400 seconds");
      await expect(generateSignedUrl("videos/test.mp4", -100)).rejects.toThrow("expiresIn must be a positive number up to 86400 seconds");
      await expect(generateSignedUrl("videos/test.mp4", 90000)).rejects.toThrow("expiresIn must be a positive number up to 86400 seconds");
      await expect(generateSignedUrl("videos/test.mp4", "invalid")).rejects.toThrow("expiresIn must be a positive number up to 86400 seconds");
      await expect(generateSignedUrl("videos/test.mp4", 12.5)).rejects.toThrow("expiresIn must be a positive number up to 86400 seconds");
    });

    it("throws when R2_BUCKET_NAME is not configured", async () => {
      const originalValue = process.env.R2_BUCKET_NAME;
      delete process.env.R2_BUCKET_NAME;

      vi.resetModules();
      const { generateSignedUrl: generateWithoutBucket } = await import("../services/r2.service.js");

      await expect(generateWithoutBucket("videos/test.mp4")).rejects.toThrow("R2_BUCKET_NAME is not configured");

      process.env.R2_BUCKET_NAME = originalValue;
    });

    it("throws when key is missing", async () => {
      await expect(generateSignedUrl("")).rejects.toThrow("R2 object key is required");
      await expect(generateSignedUrl(undefined)).rejects.toThrow("R2 object key is required");
    });
  });

  describe("R2_SIGNED_URL_EXPIRY_SECONDS", () => {
    it("exports a configurable expiry constant", () => {
      expect(R2_SIGNED_URL_EXPIRY_SECONDS).toBeGreaterThan(0);
      expect(R2_SIGNED_URL_EXPIRY_SECONDS).toBeLessThanOrEqual(86400);
    });
  });

});
