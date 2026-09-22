import {
  beforeAll,
  afterEach,
  afterAll,
  describe,
  test,
  expect,
} from "vitest";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { ReadingProgress } from "../models/readingProgress.model.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  await ReadingProgress.syncIndexes();
});

afterEach(async () => {
  await ReadingProgress.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("ReadingProgress Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const bookId = new mongoose.Types.ObjectId();
  const chapterId = new mongoose.Types.ObjectId();

  test("should create reading progress successfully", async () => {
    const progress = await ReadingProgress.create({
      userId,
      bookId,
      chapterId,
      blockNumber: 1,
      scrollPosition: 250,
      language: "ENGLISH",
      fontSize: 16,
      theme: "LIGHT",
    });

    expect(progress.userId.toString()).toBe(userId.toString());
    expect(progress.bookId.toString()).toBe(bookId.toString());
    expect(progress.blockNumber).toBe(1);
    expect(progress.scrollPosition).toBe(250);
    expect(progress.language).toBe("ENGLISH");
    expect(progress.fontSize).toBe(16);
    expect(progress.theme).toBe("LIGHT");
  });

  test("should not allow duplicate progress for same user and book", async () => {
    await ReadingProgress.create({
      userId,
      bookId,
      chapterId,
      blockNumber: 1,
      scrollPosition: 100,
    });

    await expect(
      ReadingProgress.create({
        userId,
        bookId,
        chapterId,
        blockNumber: 2,
        scrollPosition: 200,
      })
    ).rejects.toThrow();
  });

  test("should reject invalid language", async () => {
    await expect(
      ReadingProgress.create({
        userId,
        bookId,
        chapterId,
        blockNumber: 1,
        scrollPosition: 100,
        language: "HINDI",
      })
    ).rejects.toThrow();
  });

  test("should reject invalid theme", async () => {
    await expect(
      ReadingProgress.create({
        userId,
        bookId,
        chapterId,
        blockNumber: 1,
        scrollPosition: 100,
        theme: "BLUE",
      })
    ).rejects.toThrow();
  });

  test("should reject negative scroll position", async () => {
    await expect(
      ReadingProgress.create({
        userId,
        bookId,
        chapterId,
        blockNumber: 1,
        scrollPosition: -10,
      })
    ).rejects.toThrow();
  });
});

