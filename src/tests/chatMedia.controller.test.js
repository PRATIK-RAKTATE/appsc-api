import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const { mockGenerateChatMediaPresignedUploadUrl, CHAT_MEDIA_TYPE } = vi.hoisted(() => ({
  mockGenerateChatMediaPresignedUploadUrl: vi.fn(),
  CHAT_MEDIA_TYPE: {
    IMAGE: "IMAGE",
    PDF: "PDF",
    VOICE: "VOICE",
  },
}));

vi.mock("../services/r2.service.js", () => ({
  generateChatMediaPresignedUploadUrl: mockGenerateChatMediaPresignedUploadUrl,
  CHAT_MEDIA_TYPE,
}));

import {
  getChatMediaPresignedUploadController,
} from "../controllers/chatMedia.controller.js";

const mkId = () => new mongoose.Types.ObjectId().toString();

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const makeReq = (overrides = {}) => ({
  user: { userId: mkId(), role: "STUDENT" },
  params: {},
  query: {},
  body: {},
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getChatMediaPresignedUploadController", () => {
  it("returns 200 with presigned upload details for valid image", async () => {
    mockGenerateChatMediaPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://signed-url.example.com/upload",
      key: "chat-media/image/123-photo.jpg",
      contentType: "image/jpeg",
      expiresIn: 900,
      maxSize: 5 * 1024 * 1024,
      mediaType: "IMAGE",
    });

    const res = makeRes();
    await getChatMediaPresignedUploadController(
      makeReq({
        body: {
          fileName: "photo.jpg",
          contentType: "image/jpeg",
          size: 1024 * 1024,
          mediaType: "IMAGE",
        },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        uploadUrl: "https://signed-url.example.com/upload",
        key: "chat-media/image/123-photo.jpg",
        mediaType: "IMAGE",
      }),
    });
    expect(mockGenerateChatMediaPresignedUploadUrl).toHaveBeenCalledWith({
      fileName: "photo.jpg",
      contentType: "image/jpeg",
      size: 1024 * 1024,
      mediaType: "IMAGE",
    });
  });

  it("returns 400 for missing fileName", async () => {
    const res = makeRes();
    await getChatMediaPresignedUploadController(
      makeReq({
        body: {
          contentType: "image/jpeg",
          size: 1024,
          mediaType: "IMAGE",
        },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("fileName") })
    );
    expect(mockGenerateChatMediaPresignedUploadUrl).not.toHaveBeenCalled();
  });

  it("returns 400 for whitespace-only fileName", async () => {
    const res = makeRes();
    await getChatMediaPresignedUploadController(
      makeReq({
        body: {
          fileName: "   ",
          contentType: "image/jpeg",
          size: 1024,
          mediaType: "IMAGE",
        },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("fileName") })
    );
  });

  it("returns 400 for invalid mediaType", async () => {
    const res = makeRes();
    await getChatMediaPresignedUploadController(
      makeReq({
        body: {
          fileName: "file.txt",
          contentType: "text/plain",
          size: 100,
          mediaType: "VIDEO",
        },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("mediaType") })
    );
  });

  it("returns 400 for oversized file", async () => {
    mockGenerateChatMediaPresignedUploadUrl.mockRejectedValue(
      new Error("File size exceeds limit for PDF. Max allowed: 10485760 bytes")
    );

    const res = makeRes();
    await getChatMediaPresignedUploadController(
      makeReq({
        body: {
          fileName: "huge.pdf",
          contentType: "application/pdf",
          size: 20 * 1024 * 1024,
          mediaType: "PDF",
        },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("exceeds limit") })
    );
  });

  it("returns 500 for unexpected server error", async () => {
    mockGenerateChatMediaPresignedUploadUrl.mockRejectedValue(
      new Error("R2_BUCKET_NAME is not configured")
    );

    const res = makeRes();
    await getChatMediaPresignedUploadController(
      makeReq({
        body: {
          fileName: "photo.jpg",
          contentType: "image/jpeg",
          size: 1024,
          mediaType: "IMAGE",
        },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("R2_BUCKET_NAME") })
    );
  });

  it("trims whitespace from fileName and contentType before calling service", async () => {
    mockGenerateChatMediaPresignedUploadUrl.mockResolvedValue({
      uploadUrl: "https://signed-url.example.com/upload",
      key: "chat-media/image/123-photo.jpg",
      contentType: "image/jpeg",
      expiresIn: 900,
      maxSize: 5 * 1024 * 1024,
      mediaType: "IMAGE",
    });

    const res = makeRes();
    await getChatMediaPresignedUploadController(
      makeReq({
        body: {
          fileName: "  photo.jpg  ",
          contentType: "  image/jpeg  ",
          size: 1024,
          mediaType: "IMAGE",
        },
      }),
      res
    );

    expect(mockGenerateChatMediaPresignedUploadUrl).toHaveBeenCalledWith({
      fileName: "photo.jpg",
      contentType: "image/jpeg",
      size: 1024,
      mediaType: "IMAGE",
    });
  });
});
