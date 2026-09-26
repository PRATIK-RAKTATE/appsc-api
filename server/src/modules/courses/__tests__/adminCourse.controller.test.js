import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Course, COURSE_STATUS } from "../models/course.model.js";
import {
  createCourse,
  updateCurriculum,
  updateCourseStatus,
  deleteCourse,
} from "../controllers/course.controller.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe("Admin Course Controller", () => {
  const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const adminId = new mongoose.Types.ObjectId();

  const validCoursePayload = {
    title: "Test Course Package",
    description: "A complete bundle",
    thumbnailUrl: "https://r2.appsc.in/test.png",
    basePrice: 5000,
    discountedPrice: 2000,
    validityInDays: 365,
  };

  describe("createCourse", () => {
    it("should create a course package successfully", async () => {
      const req = {
        body: validCoursePayload,
        user: { _id: adminId },
      };
      const res = mockResponse();

      await createCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            title: validCoursePayload.title,
            slug: "test-course-package",
          }),
        })
      );
    });

    it("should reject course creation with invalid discount", async () => {
      const req = {
        body: {
          ...validCoursePayload,
          basePrice: 1000,
          discountedPrice: 1500, // Invalid: greater than basePrice
        },
        user: { _id: adminId },
      };
      const res = mockResponse();

      await createCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/discountedPrice must be less than or equal to basePrice/),
        })
      );
    });
  });

  describe("updateCurriculum", () => {
    let course;
    beforeEach(async () => {
      course = await Course.create({
        ...validCoursePayload,
        createdBy: adminId,
      });
    });

    it("should update the curriculum bundle", async () => {
      const curriculum = [
        {
          itemType: "VIDEO",
          itemTypeRef: "VideoLecture",
          refId: new mongoose.Types.ObjectId(),
          title: "First Video",
          order: 1,
        },
      ];

      const req = {
        params: { id: course._id },
        body: { curriculum },
      };
      const res = mockResponse();

      await updateCurriculum(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.success).toBe(true);
      expect(resData.data.curriculum.length).toBe(1);
      expect(resData.data.curriculum[0].title).toBe("First Video");
    });
  });

  describe("updateCourseStatus", () => {
    let course;
    beforeEach(async () => {
      course = await Course.create({
        ...validCoursePayload,
        createdBy: adminId,
        curriculum: [], // empty
      });
    });

    it("should prevent publishing an empty curriculum course", async () => {
      const req = {
        params: { id: course._id },
        body: { status: COURSE_STATUS.PUBLISHED },
      };
      const res = mockResponse();

      await updateCourseStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/Cannot publish a course with an empty curriculum/),
        })
      );
    });

    it("should publish a course with curriculum successfully", async () => {
      course.curriculum = [
        {
          itemType: "EBOOK",
          itemTypeRef: "EBook",
          refId: new mongoose.Types.ObjectId(),
          title: "First Book",
        },
      ];
      await course.save();

      const req = {
        params: { id: course._id },
        body: { status: COURSE_STATUS.PUBLISHED },
      };
      const res = mockResponse();

      await updateCourseStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.data.status).toBe(COURSE_STATUS.PUBLISHED);
    });
  });

  describe("deleteCourse", () => {
    let course;
    beforeEach(async () => {
      course = await Course.create({
        ...validCoursePayload,
        createdBy: adminId,
      });
    });

    it("should soft delete a course", async () => {
      const req = {
        params: { id: course._id },
      };
      const res = mockResponse();

      await deleteCourse(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.success).toBe(true);
      expect(resData.data.isDeleted).toBe(true);
      expect(resData.data.status).toBe(COURSE_STATUS.ARCHIVED);

      // Verify it's actually just soft deleted in DB
      const foundCourse = await Course.findById(course._id);
      expect(foundCourse).toBeTruthy();
      expect(foundCourse.isDeleted).toBe(true);
    });
  });
});
