import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  uploadFileToR2Mock,
  generateSignedUrlMock,
} = vi.hoisted(() => ({
  uploadFileToR2Mock: vi.fn(),
  generateSignedUrlMock: vi.fn(),
}));

const assertVideoAccessMock = vi.fn();

vi.mock("../services/r2.service.js", () => ({
  uploadFileToR2: uploadFileToR2Mock,
  generateSignedUrl: generateSignedUrlMock,
  R2_BUCKET_NAME: "test-bucket",
  R2_SIGNED_URL_EXPIRY_SECONDS: 3600,
}));

vi.mock("../services/video.service.js", () => ({
  assertVideoAccess: assertVideoAccessMock,
}));

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("Video controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadFileToR2Mock.mockResolvedValue({});
    generateSignedUrlMock.mockResolvedValue("https://signed-url.example.com/video.mp4");
    assertVideoAccessMock.mockResolvedValue(undefined);
  });

  describe("uploadVideoController", () => {
    it("uploads a video and returns r2Key", async () => {
      const { uploadVideoController } = await import("../controllers/video.controller.js");

      const req = {
        body: { title: "Test Video" },
        file: {
          buffer: Buffer.from("fake-video-content"),
          mimetype: "video/mp4",
          originalname: "test.mp4",
          size: 1024,
        },
      };
      const res = createResponse();

      await uploadVideoController(req, res);

      expect(uploadFileToR2Mock).toHaveBeenCalledOnce();
      expect(uploadFileToR2Mock).toHaveBeenCalledWith({
        key: expect.stringMatching(/^videos\/\d+-Test_Video-test\.mp4$/),
        body: req.file.buffer,
        contentType: "video/mp4",
        contentLength: 1024,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Video uploaded successfully",
        data: {
          r2Key: expect.stringMatching(/^videos\/\d+-Test_Video-test\.mp4$/),
          title: "Test Video",
          contentType: "video/mp4",
          size: 1024,
        },
      });
    });

    it("rejects missing file", async () => {
      const { uploadVideoController } = await import("../controllers/video.controller.js");

      const req = { body: { title: "Test Video" }, file: undefined };
      const res = createResponse();

      await uploadVideoController(req, res);

      expect(uploadFileToR2Mock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Video file is required" });
    });

    it("rejects missing title", async () => {
      const { uploadVideoController } = await import("../controllers/video.controller.js");

      const req = {
        body: { title: "" },
        file: {
          buffer: Buffer.from("fake"),
          mimetype: "video/mp4",
          originalname: "test.mp4",
          size: 1024,
        },
      };
      const res = createResponse();

      await uploadVideoController(req, res);

      expect(uploadFileToR2Mock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Title is required" });
    });

    it("returns 500 when R2 upload fails", async () => {
      const { uploadVideoController } = await import("../controllers/video.controller.js");
      uploadFileToR2Mock.mockRejectedValueOnce(new Error("R2 upload failed"));

      const req = {
        body: { title: "Test Video" },
        file: {
          buffer: Buffer.from("fake"),
          mimetype: "video/mp4",
          originalname: "test.mp4",
          size: 1024,
        },
      };
      const res = createResponse();

      await uploadVideoController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "R2 upload failed" });
    });
  });

  describe("getVideoSignedUrlController", () => {
    it("generates a signed URL with default expiry from query r2Key", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: { r2Key: "videos/1234-test.mp4" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("user1", "videos/1234-test.mp4");
      expect(generateSignedUrlMock).toHaveBeenCalledWith("videos/1234-test.mp4", 3600);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Signed URL generated successfully",
        data: {
          signedUrl: "https://signed-url.example.com/video.mp4",
          expiresIn: 3600,
        },
      });
    });

    it("generates a signed URL with custom expiry", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: { r2Key: "videos/1234-test.mp4", expiresIn: "1800" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("user1", "videos/1234-test.mp4");
      expect(generateSignedUrlMock).toHaveBeenCalledWith("videos/1234-test.mp4", 1800);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Signed URL generated successfully",
        data: {
          signedUrl: "https://signed-url.example.com/video.mp4",
          expiresIn: 1800,
        },
      });
    });

    it("rejects missing r2Key", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: {}, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).not.toHaveBeenCalled();
      expect(generateSignedUrlMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "r2Key is required" });
    });

    it("rejects invalid expiresIn", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: { r2Key: "videos/1234-test.mp4", expiresIn: "abc" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).not.toHaveBeenCalled();
      expect(generateSignedUrlMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "expiresIn must be a positive number up to 86400 seconds" });
    });

    it("rejects expiresIn greater than 86400", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: { r2Key: "videos/1234-test.mp4", expiresIn: "90000" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).not.toHaveBeenCalled();
      expect(generateSignedUrlMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "expiresIn must be a positive number up to 86400 seconds" });
    });

    it("rejects expiresIn of zero", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: { r2Key: "videos/1234-test.mp4", expiresIn: "0" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).not.toHaveBeenCalled();
      expect(generateSignedUrlMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "expiresIn must be a positive number up to 86400 seconds" });
    });

    it("returns 404 when user does not have access to the video", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");
      assertVideoAccessMock.mockRejectedValueOnce(new Error("You do not have access to this video"));

      const req = { query: { r2Key: "videos/1234-test.mp4" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("user1", "videos/1234-test.mp4");
      expect(generateSignedUrlMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "You do not have access to this video" });
    });

    it("returns 404 when video is not found", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");
      assertVideoAccessMock.mockRejectedValueOnce(new Error("Video not found"));

      const req = { query: { r2Key: "videos/1234-test.mp4" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("user1", "videos/1234-test.mp4");
      expect(generateSignedUrlMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "Video not found" });
    });

    it("accepts r2Key from route parameter as array (supporting slashes)", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = {
        params: { r2Key: ["videos", "2026", "lecture-1.mp4"] },
        user: { userId: "user1" },
      };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("user1", "videos/2026/lecture-1.mp4");
      expect(generateSignedUrlMock).toHaveBeenCalledWith("videos/2026/lecture-1.mp4", 3600);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("accepts r2Key from route parameter as string", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = {
        params: { r2Key: "videos/folder/lecture-1.mp4" },
        user: { userId: "user1" },
      };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("user1", "videos/folder/lecture-1.mp4");
      expect(generateSignedUrlMock).toHaveBeenCalledWith("videos/folder/lecture-1.mp4", 3600);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("accepts URL-encoded r2Key and strips leading slash", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = {
        query: { r2Key: "/videos%2Fnested%2Flecture.mp4" },
        user: { userId: "user1" },
      };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("user1", "videos/nested/lecture.mp4");
      expect(generateSignedUrlMock).toHaveBeenCalledWith("videos/nested/lecture.mp4", 3600);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("rejects slash-only or whitespace r2Key", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: { r2Key: "///" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "r2Key is required" });
    });

    it("passes user role to assertVideoAccess when present", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = {
        query: { r2Key: "videos/1234-test.mp4" },
        user: { userId: "admin1", role: "ADMIN" },
      };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(assertVideoAccessMock).toHaveBeenCalledWith("admin1", "videos/1234-test.mp4", "ADMIN");
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("rejects non-integer decimal expiresIn", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");

      const req = { query: { r2Key: "videos/1234-test.mp4", expiresIn: "10.5" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "expiresIn must be a positive number up to 86400 seconds" });
    });

    it("returns 500 on signed URL generation failure", async () => {
      const { getVideoSignedUrlController } = await import("../controllers/video.controller.js");
      generateSignedUrlMock.mockRejectedValueOnce(new Error("R2 error"));

      const req = { query: { r2Key: "videos/1234-test.mp4" }, user: { userId: "user1" } };
      const res = createResponse();

      await getVideoSignedUrlController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: "R2 error" });
    });
  });
});
