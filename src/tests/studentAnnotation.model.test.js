import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  StudentAnnotation,
  Annotation,
  ANNOTATION_TYPE,
  ANNOTATION_COLOR,
  ANNOTATION_LANGUAGE,
} from "../models/studentAnnotation.model.js";

describe("StudentAnnotation Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const bookId = new mongoose.Types.ObjectId();
  const chapterId = new mongoose.Types.ObjectId();
  const blockId = new mongoose.Types.ObjectId();

  const validAnnotation = {
    userId,
    bookId,
    chapterId,
    blockId,
    blockNumber: 1,
    type: ANNOTATION_TYPE.HIGHLIGHT,
    color: ANNOTATION_COLOR.YELLOW,
    range: {
      startOffset: 5,
      endOffset: 25,
    },
    selectedText: "Important exam concept",
    note: "Review before Prelims",
    language: ANNOTATION_LANGUAGE.ENGLISH,
    tags: ["history", "important"],
  };

  it("should validate a completely valid student annotation", async () => {
    const annotation = new StudentAnnotation(validAnnotation);

    await expect(annotation.validate()).resolves.toBeUndefined();
  });

  it("should apply default values", () => {
    const annotation = new StudentAnnotation({
      userId,
      bookId,
      chapterId,
      blockId,
    });

    expect(annotation.type).toBe(ANNOTATION_TYPE.HIGHLIGHT);
    expect(annotation.color).toBe(ANNOTATION_COLOR.YELLOW);
    expect(annotation.language).toBe(ANNOTATION_LANGUAGE.ENGLISH);
    expect(annotation.range.startOffset).toBe(0);
    expect(annotation.range.endOffset).toBe(0);
  });

  it("should require userId", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      userId: undefined,
    });

    await expect(annotation.validate()).rejects.toThrow(/userId/i);
  });

  it("should require bookId", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      bookId: undefined,
    });

    await expect(annotation.validate()).rejects.toThrow(/bookId/i);
  });

  it("should require chapterId", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      chapterId: undefined,
    });

    await expect(annotation.validate()).rejects.toThrow(/chapterId/i);
  });

  it("should require blockId", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      blockId: undefined,
    });

    await expect(annotation.validate()).rejects.toThrow(/blockId/i);
  });

  it("should require type", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      type: null,
    });

    await expect(annotation.validate()).rejects.toThrow(/type/i);
  });

  it("should reject invalid annotation type", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      type: "INVALID_TYPE",
    });

    await expect(annotation.validate()).rejects.toThrow(/type/i);
  });

  it("should reject invalid annotation color", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      color: "INVALID_COLOR",
    });

    await expect(annotation.validate()).rejects.toThrow(/color/i);
  });

  it("should reject invalid annotation language", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      language: "HINDI",
    });

    await expect(annotation.validate()).rejects.toThrow(/language/i);
  });

  it("should validate a NOTE annotation with notes content", async () => {
    const noteAnnotation = new StudentAnnotation({
      userId,
      bookId,
      chapterId,
      blockId,
      blockNumber: 3,
      type: ANNOTATION_TYPE.NOTE,
      note: "This formula will be tested in paper 2",
      selectedText: "d = r * t",
      range: { startOffset: 12, endOffset: 21 },
    });

    await expect(noteAnnotation.validate()).resolves.toBeUndefined();
    expect(noteAnnotation.type).toBe("NOTE");
  });

  it("should validate a BOOKMARK annotation without range or notes", async () => {
    const bookmark = new StudentAnnotation({
      userId,
      bookId,
      chapterId,
      blockId,
      blockNumber: 15,
      type: ANNOTATION_TYPE.BOOKMARK,
    });

    await expect(bookmark.validate()).resolves.toBeUndefined();
    expect(bookmark.type).toBe("BOOKMARK");
  });

  it("should reject negative startOffset", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      range: {
        startOffset: -5,
        endOffset: 10,
      },
    });

    await expect(annotation.validate()).rejects.toThrow(/startOffset/i);
  });

  it("should reject negative endOffset", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      range: {
        startOffset: 0,
        endOffset: -1,
      },
    });

    await expect(annotation.validate()).rejects.toThrow(/endOffset/i);
  });

  it("should reject when endOffset is less than startOffset", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      range: {
        startOffset: 50,
        endOffset: 20,
      },
    });

    await expect(annotation.validate()).rejects.toThrow(/endOffset cannot be less than startOffset/i);
  });

  it("should allow startOffset equal to endOffset", async () => {
    const annotation = new StudentAnnotation({
      ...validAnnotation,
      range: {
        startOffset: 15,
        endOffset: 15,
      },
    });

    await expect(annotation.validate()).resolves.toBeUndefined();
  });

  it("should support studentId getter and setter alias", () => {
    const annotation = new StudentAnnotation(validAnnotation);

    expect(annotation.studentId.toString()).toBe(userId.toString());

    const newUserId = new mongoose.Types.ObjectId();
    annotation.studentId = newUserId;
    expect(annotation.userId.toString()).toBe(newUserId.toString());
  });

  it("should support startOffset and endOffset virtual getters and setters", () => {
    const annotation = new StudentAnnotation(validAnnotation);

    expect(annotation.startOffset).toBe(5);
    expect(annotation.endOffset).toBe(25);

    annotation.startOffset = 30;
    annotation.endOffset = 60;
    expect(annotation.range.startOffset).toBe(30);
    expect(annotation.range.endOffset).toBe(60);
  });

  it("should support notes virtual getter and setter alias for note", () => {
    const annotation = new StudentAnnotation(validAnnotation);

    expect(annotation.notes).toBe("Review before Prelims");

    annotation.notes = "Updated note text";
    expect(annotation.note).toBe("Updated note text");
  });

  it("should export Annotation as alias for StudentAnnotation", () => {
    expect(Annotation).toBe(StudentAnnotation);
  });

  it("should export all expected enum values", () => {
    expect(ANNOTATION_TYPE.HIGHLIGHT).toBe("HIGHLIGHT");
    expect(ANNOTATION_TYPE.NOTE).toBe("NOTE");
    expect(ANNOTATION_TYPE.BOOKMARK).toBe("BOOKMARK");

    expect(ANNOTATION_COLOR.YELLOW).toBe("YELLOW");
    expect(ANNOTATION_COLOR.GREEN).toBe("GREEN");
    expect(ANNOTATION_COLOR.BLUE).toBe("BLUE");
    expect(ANNOTATION_COLOR.PINK).toBe("PINK");
    expect(ANNOTATION_COLOR.PURPLE).toBe("PURPLE");
    expect(ANNOTATION_COLOR.ORANGE).toBe("ORANGE");

    expect(ANNOTATION_LANGUAGE.ENGLISH).toBe("ENGLISH");
    expect(ANNOTATION_LANGUAGE.TELUGU).toBe("TELUGU");
  });

  it("should define compound indexes for student navigation and drawer lookups", () => {
    const indexes = StudentAnnotation.schema.indexes();

    const hasUserBookTypeIndex = indexes.some(([fields]) => (
      fields.userId === 1 && fields.bookId === 1 && fields.type === 1
    ));
    const hasUserChapterIndex = indexes.some(([fields]) => (
      fields.userId === 1 && fields.chapterId === 1
    ));
    const hasUserBlockIndex = indexes.some(([fields]) => (
      fields.userId === 1 && fields.blockId === 1
    ));

    expect(hasUserBookTypeIndex).toBe(true);
    expect(hasUserChapterIndex).toBe(true);
    expect(hasUserBlockIndex).toBe(true);
  });
});
