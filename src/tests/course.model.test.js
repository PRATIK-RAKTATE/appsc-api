import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  Course,
  COURSE_STATUS,
  COURSE_ITEM_TYPES,
  PRICE_CURRENCY,
} from "../models/course.model.js";

describe("Course Model", () => {
  const validCourse = {
    title: "APPSC Group 1 Comprehensive Bundle 2026",
    description: "Complete preparation bundle with tests, books, and videos.",
    thumbnail: {
      url: "https://r2.appsc.in/thumbnails/group1.png",
      key: "thumbnails/group1.png",
    },
    validityDays: 180,
    pricing: {
      amount: 4999,
      salePrice: 2999,
      currency: PRICE_CURRENCY.INR,
      priceTiers: [
        {
          name: "6 Months Access",
          validityDays: 180,
          price: 4999,
          salePrice: 2999,
          currency: PRICE_CURRENCY.INR,
        },
        {
          name: "1 Year Access",
          validityDays: 365,
          price: 7999,
          salePrice: 4999,
          currency: PRICE_CURRENCY.INR,
        },
      ],
    },
    bundledContent: {
      books: [new mongoose.Types.ObjectId()],
      tests: [new mongoose.Types.ObjectId()],
      videos: [
        {
          title: "Introduction to Indian Polity",
          videoUrl: "https://r2.appsc.in/videos/polity-intro.mp4",
          duration: 3600,
          r2Key: "videos/polity-intro.mp4",
          videoId: new mongoose.Types.ObjectId(),
        },
      ],
    },
    status: COURSE_STATUS.PUBLISHED,
    createdBy: new mongoose.Types.ObjectId(),
    tags: ["APPSC", "Group 1", "Prelims", "Mains"],
  };

  it("should validate a completely valid course", async () => {
    const course = new Course(validCourse);
    await expect(course.validate()).resolves.toBeUndefined();
  });

  it("should accept string URL for thumbnail via setter", async () => {
    const course = new Course({
      ...validCourse,
      thumbnail: "https://r2.appsc.in/thumbnails/custom.png",
    });

    expect(course.thumbnail.url).toBe("https://r2.appsc.in/thumbnails/custom.png");
    await expect(course.validate()).resolves.toBeUndefined();
  });

  it("should apply default values for status, validityDays, and currency", () => {
    const course = new Course({
      title: "APPSC Minimal Course",
      pricing: {
        amount: 1999,
      },
      createdBy: new mongoose.Types.ObjectId(),
    });

    expect(course.status).toBe(COURSE_STATUS.DRAFT);
    expect(course.validityDays).toBe(365);
    expect(course.pricing.currency).toBe(PRICE_CURRENCY.INR);
    expect(course.bundledContent.books).toEqual([]);
    expect(course.bundledContent.tests).toEqual([]);
    expect(course.bundledContent.videos).toEqual([]);
  });

  it("should require title", async () => {
    const course = new Course({
      ...validCourse,
      title: undefined,
    });

    await expect(course.validate()).rejects.toThrow(/title/i);
  });

  it("should reject title that is too short", async () => {
    const course = new Course({
      ...validCourse,
      title: "A",
    });

    await expect(course.validate()).rejects.toThrow();
  });

  it("should require pricing with amount", async () => {
    const course = new Course({
      ...validCourse,
      pricing: undefined,
    });

    await expect(course.validate()).rejects.toThrow();
  });

  it("should reject negative pricing amount", async () => {
    const course = new Course({
      ...validCourse,
      pricing: {
        amount: -500,
      },
    });

    await expect(course.validate()).rejects.toThrow();
  });

  it("should require createdBy", async () => {
    const course = new Course({
      ...validCourse,
      createdBy: undefined,
    });

    await expect(course.validate()).rejects.toThrow(/createdBy/i);
  });

  it("should reject invalid status", async () => {
    const course = new Course({
      ...validCourse,
      status: "INVALID_STATUS",
    });

    await expect(course.validate()).rejects.toThrow();
  });

  it("should reject validityDays less than 1", async () => {
    const course = new Course({
      ...validCourse,
      validityDays: 0,
    });

    await expect(course.validate()).rejects.toThrow();
  });

  it("should validate price tier constraints", async () => {
    const courseWithInvalidTier = new Course({
      ...validCourse,
      pricing: {
        amount: 5000,
        priceTiers: [
          {
            name: "Invalid Tier",
            validityDays: 0, // invalid: min is 1
            price: 1000,
          },
        ],
      },
    });

    await expect(courseWithInvalidTier.validate()).rejects.toThrow();
  });

  it("should correctly export constants", () => {
    expect(COURSE_STATUS.DRAFT).toBe("DRAFT");
    expect(COURSE_STATUS.PUBLISHED).toBe("PUBLISHED");
    expect(COURSE_STATUS.ARCHIVED).toBe("ARCHIVED");

    expect(COURSE_ITEM_TYPES.BOOK).toBe("BOOK");
    expect(COURSE_ITEM_TYPES.TEST).toBe("TEST");
    expect(COURSE_ITEM_TYPES.VIDEO).toBe("VIDEO");
  });
});
