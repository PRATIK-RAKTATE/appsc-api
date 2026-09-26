import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Annotation, ANNOTATION_TYPE, ANNOTATION_COLOR } from "../models/annotation.model.js";
import {
  createAnnotation,
  getBookAnnotations,
  updateAnnotation,
  deleteAnnotation
} from "../controllers/annotation.controller.js";

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

describe("Annotation Controller", () => {
  const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();
  const bookId = new mongoose.Types.ObjectId();
  const chapterId = "chapter-1";

  describe("createAnnotation", () => {
    it("should create a highlight", async () => {
      const req = {
        user: { userId: userAId.toString() },
        body: {
          bookId: bookId.toString(),
          chapterId,
          type: ANNOTATION_TYPE.HIGHLIGHT,
          selectedText: "Important text",
          startOffset: 10,
          endOffset: 24,
        }
      };
      const res = mockResponse();

      await createAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const resData = res.json.mock.calls[0][0];
      expect(resData.data.type).toBe(ANNOTATION_TYPE.HIGHLIGHT);
      expect(resData.data.selectedText).toBe("Important text");
    });

    it("should prevent duplicate bookmarks for the exact same page/chapter", async () => {
      await Annotation.create({
        userId: userAId,
        bookId,
        chapterId,
        type: ANNOTATION_TYPE.BOOKMARK,
        pageNumber: 5,
      });

      const req = {
        user: { userId: userAId.toString() },
        body: {
          bookId: bookId.toString(),
          chapterId,
          type: ANNOTATION_TYPE.BOOKMARK,
          pageNumber: 5,
        }
      };
      const res = mockResponse();

      await createAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Bookmark already exists for this location" }));
    });
  });

  describe("getBookAnnotations", () => {
    beforeEach(async () => {
      await Annotation.create({
        userId: userAId,
        bookId,
        chapterId,
        type: ANNOTATION_TYPE.HIGHLIGHT,
      });
      await Annotation.create({
        userId: userAId,
        bookId,
        chapterId: "chapter-2",
        type: ANNOTATION_TYPE.NOTE,
      });
      await Annotation.create({
        userId: userBId, // Another user
        bookId,
        type: ANNOTATION_TYPE.HIGHLIGHT,
      });
    });

    it("should return annotations only for the requesting user and specific book", async () => {
      const req = {
        user: { userId: userAId.toString() },
        params: { bookId: bookId.toString() },
        query: {}
      };
      const res = mockResponse();

      await getBookAnnotations(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.data.length).toBe(2);
    });

    it("should filter by type and chapterId", async () => {
      const req = {
        user: { userId: userAId.toString() },
        params: { bookId: bookId.toString() },
        query: { chapterId: "chapter-2", type: ANNOTATION_TYPE.NOTE }
      };
      const res = mockResponse();

      await getBookAnnotations(req, res);

      const resData = res.json.mock.calls[0][0];
      expect(resData.data.length).toBe(1);
      expect(resData.data[0].chapterId).toBe("chapter-2");
    });
  });

  describe("updateAnnotation", () => {
    let annotation;
    beforeEach(async () => {
      annotation = await Annotation.create({
        userId: userAId,
        bookId,
        type: ANNOTATION_TYPE.HIGHLIGHT,
        color: ANNOTATION_COLOR.YELLOW,
      });
    });

    it("should update note text and color for the owner", async () => {
      const req = {
        user: { userId: userAId.toString() },
        params: { id: annotation._id.toString() },
        body: { color: ANNOTATION_COLOR.GREEN, noteText: "Updated note" }
      };
      const res = mockResponse();

      await updateAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.data.color).toBe(ANNOTATION_COLOR.GREEN);
      expect(resData.data.noteText).toBe("Updated note");
    });

    it("should reject update if user is not the owner (IDOR protection)", async () => {
      const req = {
        user: { userId: userBId.toString() },
        params: { id: annotation._id.toString() },
        body: { color: ANNOTATION_COLOR.GREEN }
      };
      const res = mockResponse();

      await updateAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Unauthorized to update this annotation" }));
    });
  });

  describe("deleteAnnotation", () => {
    let annotation;
    beforeEach(async () => {
      annotation = await Annotation.create({
        userId: userAId,
        bookId,
        type: ANNOTATION_TYPE.HIGHLIGHT,
      });
    });

    it("should delete the annotation for the owner", async () => {
      const req = {
        user: { userId: userAId.toString() },
        params: { id: annotation._id.toString() }
      };
      const res = mockResponse();

      await deleteAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const exists = await Annotation.findById(annotation._id);
      expect(exists).toBeNull();
    });

    it("should reject deletion if user is not the owner (IDOR protection)", async () => {
      const req = {
        user: { userId: userBId.toString() },
        params: { id: annotation._id.toString() }
      };
      const res = mockResponse();

      await deleteAnnotation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Unauthorized to delete this annotation" }));
    });
  });
});

