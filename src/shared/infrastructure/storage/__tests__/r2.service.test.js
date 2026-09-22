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
  DeleteObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

process.env.R2_BUCKET_NAME = "test-bucket";
process.env.R2_ENDPOINT = "https://test.r2.cloudflarestorage.com";
process.env.R2_ACCESS_KEY_ID = "test-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_SIGNED_URL_EXPIRY_SECONDS = "900";

const {
  generatePresignedUploadUrl,
  generateSignedUrl,
  uploadFileToR2,
  deleteFileFromR2,
  getFileUrl,
  R2_SIGNED_URL_EXPIRY_SECONDS,
} = await import("../services/r2.service.js");
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = await import("@aws-sdk/client-s3");

describe("R2 Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue("https://signed-url.example.com/upload");
  });

  describe("generatePresignedUploadUrl", () => {
    it("generates presigned upload PUT URL with object parameters", async () => {
      const url = await generatePresignedUploadUrl({
        key: "books/123/file.pdf",
        contentType: "application/pdf",
      });

      expect(url).toBe("https://signed-url.example.com/upload");
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "books/123/file.pdf",
        ContentType: "application/pdf",
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 900 }
      );
    });

    it("generates presigned upload PUT URL with positional parameters", async () => {
      const url = await generatePresignedUploadUrl(
        "books/123/file.pdf",
        "application/pdf",
        1800
      );

      expect(url).toBe("https://signed-url.example.com/upload");
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "books/123/file.pdf",
        ContentType: "application/pdf",
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 1800 }
      );
    });

    it("throws when key is missing", async () => {
      await expect(generatePresignedUploadUrl("")).rejects.toThrow(
        "R2 object key is required"
      );
      await expect(
        generatePresignedUploadUrl({ key: "" })
      ).rejects.toThrow("R2 object key is required");
    });

    it("throws when expiry is invalid", async () => {
      await expect(
        generatePresignedUploadUrl({ key: "test", expiresIn: -1 })
      ).rejects.toThrow("expiresIn must be a positive number up to 86400 seconds");
    });
  });

  describe("generateSignedUrl", () => {
    it("generates download signed URL", async () => {
      const url = await generateSignedUrl("books/123/file.pdf", 600);

      expect(url).toBe("https://signed-url.example.com/upload");
      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "books/123/file.pdf",
      });
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 600 }
      );
    });
  });

  describe("uploadFileToR2 and deleteFileFromR2", () => {
    it("uploads file to R2", async () => {
      const body = Buffer.from("pdf content");
      await uploadFileToR2({
        key: "books/123/file.pdf",
        body,
        contentType: "application/pdf",
      });

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "books/123/file.pdf",
        Body: body,
        ContentType: "application/pdf",
      });
      expect(mockSend).toHaveBeenCalled();
    });

    it("deletes file from R2", async () => {
      await deleteFileFromR2("books/123/file.pdf");

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "books/123/file.pdf",
      });
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe("getFileUrl", () => {
    it("builds file URL using endpoint and bucket", () => {
      const url = getFileUrl("books/123/file.pdf");
      expect(url).toBe(
        "https://test.r2.cloudflarestorage.com/test-bucket/books/123/file.pdf"
      );
    });

    it("returns empty string when key is empty", () => {
      expect(getFileUrl("")).toBe("");
    });
  });
});
