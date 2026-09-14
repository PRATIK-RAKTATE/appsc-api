import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindOne = vi.fn();

vi.mock("../models/course.model.js", () => ({
  Course: { findOne: mockFindOne },
}));

vi.mock("../models/courseModule.model.js", () => ({
  CourseModule: { findOne: mockFindOne },
}));

vi.mock("../models/userEntitlement.model.js", () => ({
  UserEntitlement: { findOne: mockFindOne },
  ENTITLEMENT_STATUS: {
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    REVOKED: "REVOKED",
  },
}));

const { findCourseIdByR2Key, assertVideoAccess } = await import("../services/video.service.js");

describe("Video service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findCourseIdByR2Key", () => {
    it("returns courseId when r2Key is in course bundledContent.videos", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });

      const result = await findCourseIdByR2Key("videos/course1-test.mp4");

      expect(result).toBe("course1");
      expect(mockFindOne).toHaveBeenNthCalledWith(1, {
        "bundledContent.videos.r2Key": "videos/course1-test.mp4",
      });
    });

    it("returns courseId from module when not found in course", async () => {
      mockFindOne.mockResolvedValueOnce(null);
      mockFindOne.mockResolvedValueOnce({ courseId: "course2" });

      const result = await findCourseIdByR2Key("videos/module1-test.mp4");

      expect(result).toBe("course2");
      expect(mockFindOne).toHaveBeenNthCalledWith(2, {
        "items.videoMetadata.r2Key": "videos/module1-test.mp4",
      });
    });

    it("returns null when r2Key is not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await findCourseIdByR2Key("videos/unknown.mp4");

      expect(result).toBeNull();
      expect(mockFindOne).toHaveBeenCalledTimes(2);
    });
  });

  describe("assertVideoAccess", () => {
    it("grants access when entitlement is valid", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });
      mockFindOne.mockResolvedValueOnce({
        _id: "ent1",
        userId: "user1",
        courseId: "course1",
        status: "ACTIVE",
        startsAt: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 1000),
      });

      await expect(assertVideoAccess("user1", "videos/course1-test.mp4")).resolves.toBeUndefined();
    });

    it("denies access when entitlement is missing", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });
      mockFindOne.mockResolvedValueOnce(null);

      await expect(assertVideoAccess("user1", "videos/course1-test.mp4")).rejects.toThrow("You do not have access to this video");
    });

    it("denies access when entitlement is expired", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });
      mockFindOne.mockResolvedValueOnce(null);

      await expect(assertVideoAccess("user1", "videos/course1-test.mp4")).rejects.toThrow("You do not have access to this video");
    });

    it("denies access when entitlement starts in the future", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });
      mockFindOne.mockResolvedValueOnce(null);

      await expect(assertVideoAccess("user1", "videos/course1-test.mp4")).rejects.toThrow("You do not have access to this video");
    });

    it("grants access to ADMIN user without entitlement", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });

      await expect(assertVideoAccess("adminUser", "videos/course1-test.mp4", "ADMIN")).resolves.toBeUndefined();
      expect(mockFindOne).toHaveBeenCalledTimes(1);
    });

    it("grants access to MENTOR user without entitlement", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });

      await expect(assertVideoAccess({ userId: "mentorUser", role: "MENTOR" }, "videos/course1-test.mp4")).resolves.toBeUndefined();
      expect(mockFindOne).toHaveBeenCalledTimes(1);
    });

    it("grants access when module item is marked as free preview", async () => {
      mockFindOne.mockResolvedValueOnce(null); // Course.findOne
      mockFindOne.mockResolvedValueOnce({
        courseId: "course2",
        items: [
          {
            videoMetadata: { r2Key: "videos/free-preview.mp4" },
            isFreePreview: true,
          },
        ],
      }); // CourseModule.findOne

      await expect(assertVideoAccess("user1", "videos/free-preview.mp4")).resolves.toBeUndefined();
      expect(mockFindOne).toHaveBeenCalledTimes(2);
    });

    it("denies access when user is not provided", async () => {
      mockFindOne.mockResolvedValueOnce({ _id: "course1" });

      await expect(assertVideoAccess(null, "videos/course1-test.mp4")).rejects.toThrow("You do not have access to this video");
    });

    it("throws when video is not found", async () => {
      mockFindOne.mockResolvedValue(null);

      await expect(assertVideoAccess("user1", "videos/unknown.mp4")).rejects.toThrow("Video not found");
    });
  });

});
