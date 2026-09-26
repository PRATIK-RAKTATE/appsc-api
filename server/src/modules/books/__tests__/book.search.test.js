import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import bookRoutes from "../routes/book.routes.js";
import { verifyToken } from "../../auth/index.js";
import { BookBlock } from "../models/bookBlock.model.js";
import { Chapter } from "../models/chapter.model.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Mock verifyToken to bypass auth
vi.mock("../../auth/index.js", () => ({
  verifyToken: (req, res, next) => {
    req.user = { userId: "user-123" };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use("/api/books", bookRoutes);

describe("Book Search API", () => {
  beforeEach(async () => {
    await BookBlock.deleteMany({});
    await Chapter.deleteMany({});
  });

  it("should return 400 if query q is missing", async () => {
    const res = await request(app).get("/api/books/507f1f77bcf86cd799439011/search");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Search query 'q' is required");
  });

  it("should search English keywords and return marked snippets", async () => {
    const bookId = new mongoose.Types.ObjectId();
    const chapterId = new mongoose.Types.ObjectId();
    
    await Chapter.create({
      _id: chapterId,
      bookId,
      title: "Test Chapter",
      chapterNumber: 1,
      status: "COMPLETED"
    });

    await BookBlock.create({
      bookId,
      chapterId,
      blockNumber: 1,
      contentEn: "The Constitution of India is the supreme law of India.",
      contentTe: "భారత రాజ్యాంగం భారతదేశపు అత్యున్నత చట్టం.",
    });

    await BookBlock.createIndexes();

    const res = await request(app).get(`/api/books/${bookId}/search?q=Constitution`);
    
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0].snippetEn).toContain("<mark>Constitution</mark>");
  });

  it("should search Telugu keywords and return marked snippets", async () => {
    const bookId = new mongoose.Types.ObjectId();
    const chapterId = new mongoose.Types.ObjectId();
    
    await Chapter.create({
      _id: chapterId,
      bookId,
      title: "Test Chapter",
      chapterNumber: 1,
      status: "COMPLETED"
    });

    await BookBlock.create({
      bookId,
      chapterId,
      blockNumber: 1,
      contentEn: "The Constitution of India is the supreme law of India.",
      contentTe: "భారత రాజ్యాంగం భారతదేశపు అత్యున్నత చట్టం.",
    });

    await BookBlock.createIndexes();

    const res = await request(app).get(`/api/books/${bookId}/search?q=రాజ్యాంగం`);
    
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0].snippetTe).toContain("<mark>రాజ్యాంగం</mark>");
  });

  it("should filter by chapterId", async () => {
    const bookId = new mongoose.Types.ObjectId();
    const chapter1 = new mongoose.Types.ObjectId();
    const chapter2 = new mongoose.Types.ObjectId();
    
    await Chapter.create([
      { _id: chapter1, bookId, title: "Ch 1", chapterNumber: 1, status: "COMPLETED" },
      { _id: chapter2, bookId, title: "Ch 2", chapterNumber: 2, status: "COMPLETED" },
    ]);

    await BookBlock.create([
      { bookId, chapterId: chapter1, blockNumber: 1, contentEn: "Apple is red", contentTe: "ఆపిల్ ఎరుపు" },
      { bookId, chapterId: chapter2, blockNumber: 1, contentEn: "Banana is yellow", contentTe: "అరటి పండు పసుపు" },
    ]);

    await BookBlock.createIndexes();

    const res = await request(app).get(`/api/books/${bookId}/search?q=red&chapterId=${chapter2}`);
    
    expect(res.body.data).toHaveLength(0);

    const res2 = await request(app).get(`/api/books/${bookId}/search?q=red&chapterId=${chapter1}`);
    expect(res2.body.data).toHaveLength(1);
  });
});
