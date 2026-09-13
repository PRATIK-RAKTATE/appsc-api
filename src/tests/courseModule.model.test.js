import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  CourseModule,
  MODULE_STATUS,
  MODULE_ITEM_TYPE,
  MODULE_ITEM_MODELS,
} from "../models/courseModule.model.js";

describe("CourseModule Model", () => {
  const courseId = new mongoose.Types.ObjectId();
  const bookId = new mongoose.Types.ObjectId();
  const testId = new mongoose.Types.ObjectId();
  const chapterId = new mongoose.Types.ObjectId();

  const validModule = {
    courseId,
    title: "Module 1: General Studies & Indian Economy",
    description: "Core syllabus coverage with e-books, chapter breakdown, and unit tests.",
    order: 1,
    status: MODULE_STATUS.PUBLISHED,
    items: [
      {
        title: "Economy Master Textbook",
        itemType: MODULE_ITEM_TYPE.BOOK,
        itemId: bookId,
        itemModel: MODULE_ITEM_MODELS.BOOK,
        order: 1,
        isFreePreview: true,
      },
      {
        title: "Chapter 1: National Income Accounting",
        itemType: MODULE_ITEM_TYPE.CHAPTER,
        itemId: chapterId,
        itemModel: MODULE_ITEM_MODELS.CHAPTER,
        order: 2,
        isFreePreview: false,
      },
      {
        title: "Video: Macroeconomics Fundamentals",
        itemType: MODULE_ITEM_TYPE.VIDEO,
        order: 3,
        videoMetadata: {
          videoUrl: "https://r2.appsc.in/videos/macro-01.mp4",
          duration: 2400,
          r2Key: "videos/macro-01.mp4",
          thumbnailUrl: "https://r2.appsc.in/thumbs/macro-01.png",
        },
        isFreePreview: true,
      },
      {
        title: "Unit Test 1: Economy & Planning",
        itemType: MODULE_ITEM_TYPE.TEST,
        itemId: testId,
        itemModel: MODULE_ITEM_MODELS.TEST,
        order: 4,
        isFreePreview: false,
      },
    ],
  };

  it("should validate a completely valid course module", async () => {
    const courseModule = new CourseModule(validModule);
    await expect(courseModule.validate()).resolves.toBeUndefined();
  });

  it("should support bundledItems virtual alias for items", async () => {
    const courseModule = new CourseModule({
      courseId,
      title: "Module with Bundled Items",
      order: 1,
      bundledItems: [
        {
          title: "Sample Book",
          itemType: MODULE_ITEM_TYPE.BOOK,
          itemId: bookId,
          itemModel: MODULE_ITEM_MODELS.BOOK,
          order: 1,
        },
      ],
    });

    expect(courseModule.items.length).toBe(1);
    expect(courseModule.bundledItems.length).toBe(1);
    expect(courseModule.bundledItems[0].title).toBe("Sample Book");
    await expect(courseModule.validate()).resolves.toBeUndefined();
  });

  it("should apply default values for status and items", () => {
    const courseModule = new CourseModule({
      courseId,
      title: "Module 2: AP History & Culture",
      order: 2,
    });

    expect(courseModule.status).toBe(MODULE_STATUS.PUBLISHED);
    expect(courseModule.items).toEqual([]);
  });

  it("should require courseId", async () => {
    const courseModule = new CourseModule({
      ...validModule,
      courseId: undefined,
    });

    await expect(courseModule.validate()).rejects.toThrow(/courseId/i);
  });

  it("should require title", async () => {
    const courseModule = new CourseModule({
      ...validModule,
      title: undefined,
    });

    await expect(courseModule.validate()).rejects.toThrow(/title/i);
  });

  it("should require order", async () => {
    const courseModule = new CourseModule({
      ...validModule,
      order: undefined,
    });

    await expect(courseModule.validate()).rejects.toThrow(/order/i);
  });

  it("should reject order less than 1", async () => {
    const courseModule = new CourseModule({
      ...validModule,
      order: 0,
    });

    await expect(courseModule.validate()).rejects.toThrow();
  });

  it("should reject invalid module status", async () => {
    const courseModule = new CourseModule({
      ...validModule,
      status: "UNKNOWN_STATUS",
    });

    await expect(courseModule.validate()).rejects.toThrow();
  });

  it("should reject invalid itemType in items", async () => {
    const courseModule = new CourseModule({
      ...validModule,
      items: [
        {
          title: "Invalid Item",
          itemType: "PODCAST",
          order: 1,
        },
      ],
    });

    await expect(courseModule.validate()).rejects.toThrow();
  });

  it("should correctly export enums and constants", () => {
    expect(MODULE_STATUS.DRAFT).toBe("DRAFT");
    expect(MODULE_STATUS.PUBLISHED).toBe("PUBLISHED");

    expect(MODULE_ITEM_TYPE.BOOK).toBe("BOOK");
    expect(MODULE_ITEM_TYPE.TEST).toBe("TEST");
    expect(MODULE_ITEM_TYPE.VIDEO).toBe("VIDEO");
    expect(MODULE_ITEM_TYPE.CHAPTER).toBe("CHAPTER");

    expect(MODULE_ITEM_MODELS.BOOK).toBe("Book");
    expect(MODULE_ITEM_MODELS.TEST).toBe("Test");
    expect(MODULE_ITEM_MODELS.CHAPTER).toBe("Chapter");
    expect(MODULE_ITEM_MODELS.VIDEO).toBe("Video");
  });
});
