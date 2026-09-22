import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Course, COURSE_STATUS, COURSE_ITEM_TYPES } from "../models/course.model.js";

describe("Course Model", () => {
  const validCourse = {
    title: "APPSC Group 1 Comprehensive Bundle 2026",
    description: "Complete preparation bundle with tests, books, and videos.",
    thumbnailUrl: "https://r2.appsc.in/thumbnails/group1.png",
    basePrice: 4999,
    discountedPrice: 2999,
    validityInDays: 180,
    status: COURSE_STATUS.PUBLISHED,
    createdBy: new mongoose.Types.ObjectId(),
    curriculum: [
      {
        itemType: "VIDEO",
        itemTypeRef: "VideoLecture",
        refId: new mongoose.Types.ObjectId(),
        title: "Introduction to Indian Polity",
        order: 1,
        isFreePreview: true,
      },
    ],
  };

  it("should validate a completely valid course", async () => {
    const course = new Course(validCourse);
    await expect(course.validate()).resolves.toBeUndefined();
  });

  it("should automatically generate a slug from the title", async () => {
    const course = new Course(validCourse);
    await course.validate();
    expect(course.slug).toBe("appsc-group-1-comprehensive-bundle-2026");
  });

  it("should reject a discounted package price greater than its base price", async () => {
    const course = new Course({
      ...validCourse,
      basePrice: 1000,
      discountedPrice: 1001,
      validityInDays: 30,
    });

    await expect(course.validate()).rejects.toThrow(/discountedPrice/i);
  });

  it("should expose ordered curriculum entries with supported dynamic item types", async () => {
    const videoId = new mongoose.Types.ObjectId();
    const course = new Course({
      ...validCourse,
      curriculum: [
        {
          itemType: "VIDEO",
          itemTypeRef: "VideoLecture",
          refId: videoId,
          title: "Polity introduction",
          order: 0,
          isFreePreview: true,
        },
      ],
    });

    await expect(course.validate()).resolves.toBeUndefined();
    expect(course.curriculum[0]).toMatchObject({ itemType: "VIDEO", itemTypeRef: "VideoLecture", refId: videoId, order: 0, isFreePreview: true });
  });

  it("should require createdBy", async () => {
    const course = new Course({
      ...validCourse,
      createdBy: undefined,
    });

    await expect(course.validate()).rejects.toThrow(/createdBy/i);
  });

  it("should correctly export constants", () => {
    expect(COURSE_STATUS.DRAFT).toBe("DRAFT");
    expect(COURSE_STATUS.PUBLISHED).toBe("PUBLISHED");
    expect(COURSE_STATUS.ARCHIVED).toBe("ARCHIVED");

    expect(COURSE_ITEM_TYPES.VIDEO).toBe("VIDEO");
    expect(COURSE_ITEM_TYPES.EBOOK).toBe("EBOOK");
    expect(COURSE_ITEM_TYPES.TEST_SERIES).toBe("TEST_SERIES");
  });
});
