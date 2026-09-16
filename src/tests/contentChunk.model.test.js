import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { ContentChunk } from "../models/contentChunk.model.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await ContentChunk.deleteMany({});
});

const validChunkData = () => ({
  bookId: new mongoose.Types.ObjectId(),
  title: "Fundamental Rights – Chapter 3",
  content:
    "Articles 12–35 of the Indian Constitution enumerate the fundamental rights guaranteed to citizens.",
  embedding: Array(1536).fill(0.1),
  metadata: {
    subject: "Polity",
    topic: "Fundamental Rights",
    language: "EN",
    pageNumber: 42,
  },
});

describe("ContentChunk model schema validation", () => {
  describe("valid documents", () => {
    it("should save a valid ContentChunk document", async () => {
      const chunk = new ContentChunk(validChunkData());
      const saved = await chunk.save();
      expect(saved._id).toBeDefined();
      expect(saved.title).toBe("Fundamental Rights – Chapter 3");
      expect(saved.embedding).toHaveLength(1536);
    });

    it("should store all metadata fields correctly", async () => {
      const chunk = new ContentChunk(validChunkData());
      const saved = await chunk.save();
      expect(saved.metadata.subject).toBe("Polity");
      expect(saved.metadata.topic).toBe("Fundamental Rights");
      expect(saved.metadata.language).toBe("EN");
      expect(saved.metadata.pageNumber).toBe(42);
    });

    it("should accept language 'TE'", async () => {
      const data = validChunkData();
      data.metadata.language = "TE";
      const chunk = new ContentChunk(data);
      const saved = await chunk.save();
      expect(saved.metadata.language).toBe("TE");
    });

    it("should default language to 'EN' when not provided", async () => {
      const data = validChunkData();
      delete data.metadata.language;
      const chunk = new ContentChunk(data);
      const saved = await chunk.save();
      expect(saved.metadata.language).toBe("EN");
    });

    it("should allow chapterId to be null (default)", async () => {
      const data = validChunkData();
      const chunk = new ContentChunk(data);
      const saved = await chunk.save();
      expect(saved.chapterId).toBeNull();
    });

    it("should store chapterId when provided", async () => {
      const data = validChunkData();
      data.chapterId = "chapter-001";
      const chunk = new ContentChunk(data);
      const saved = await chunk.save();
      expect(saved.chapterId).toBe("chapter-001");
    });
  });

  describe("required field validation", () => {
    it("should fail validation when bookId is missing", async () => {
      const data = validChunkData();
      delete data.bookId;
      await expect(new ContentChunk(data).save()).rejects.toThrow();
    });

    it("should fail validation when title is missing", async () => {
      const data = validChunkData();
      delete data.title;
      await expect(new ContentChunk(data).save()).rejects.toThrow();
    });

    it("should fail validation when content is missing", async () => {
      const data = validChunkData();
      delete data.content;
      await expect(new ContentChunk(data).save()).rejects.toThrow();
    });

    it("should fail validation when embedding is missing", async () => {
      const data = validChunkData();
      delete data.embedding;
      await expect(new ContentChunk(data).save()).rejects.toThrow();
    });

    it("should fail validation when embedding is an empty array", async () => {
      const data = validChunkData();
      data.embedding = [];
      await expect(new ContentChunk(data).save()).rejects.toThrow(
        "Embedding vector must be a non-empty array of numbers"
      );
    });
  });

  describe("enum and type validation", () => {
    it("should fail when language is an unsupported value", async () => {
      const data = validChunkData();
      data.metadata.language = "FR";
      await expect(new ContentChunk(data).save()).rejects.toThrow();
    });

    it("should fail when pageNumber is less than 1", async () => {
      const data = validChunkData();
      data.metadata.pageNumber = 0;
      await expect(new ContentChunk(data).save()).rejects.toThrow();
    });
  });
});
