import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  StudentMentorThread,
  MENTOR_THREAD_STATUS,
} from "../models/studentMentorThread.model.js";

describe("StudentMentorThread Model", () => {
  const studentId = new mongoose.Types.ObjectId();
  const mentorId = new mongoose.Types.ObjectId();

  const validThread = {
    studentId,
    mentorId,
    status: MENTOR_THREAD_STATUS.ACTIVE,
    lastMessageAt: new Date(),
  };

  it("should validate a completely valid student mentor thread", async () => {
    const thread = new StudentMentorThread(validThread);

    await expect(thread.validate()).resolves.toBeUndefined();
  });

  it("should apply ACTIVE as the default status", () => {
    const thread = new StudentMentorThread({ studentId, mentorId });

    expect(thread.status).toBe(MENTOR_THREAD_STATUS.ACTIVE);
  });

  it("should require studentId", async () => {
    const thread = new StudentMentorThread({
      ...validThread,
      studentId: undefined,
    });

    await expect(thread.validate()).rejects.toThrow(/studentId/i);
  });

  it("should require mentorId", async () => {
    const thread = new StudentMentorThread({
      ...validThread,
      mentorId: undefined,
    });

    await expect(thread.validate()).rejects.toThrow(/mentorId/i);
  });

  it("should reject an invalid status", async () => {
    const thread = new StudentMentorThread({
      ...validThread,
      status: "INVALID_STATUS",
    });

    await expect(thread.validate()).rejects.toThrow(/status/i);
  });

  it("should allow a thread to be closed", async () => {
    const thread = new StudentMentorThread({
      ...validThread,
      status: MENTOR_THREAD_STATUS.CLOSED,
    });

    await expect(thread.validate()).resolves.toBeUndefined();
    expect(thread.status).toBe(MENTOR_THREAD_STATUS.CLOSED);
  });

  it("should allow lastMessageAt to be omitted", async () => {
    const thread = new StudentMentorThread({ studentId, mentorId });

    await expect(thread.validate()).resolves.toBeUndefined();
    expect(thread.lastMessageAt).toBeUndefined();
  });

  it("should define timestamp fields", () => {
    expect(StudentMentorThread.schema.path("createdAt")).toBeDefined();
    expect(StudentMentorThread.schema.path("updatedAt")).toBeDefined();
  });

  it("should define the unique student and mentor index", () => {
    const indexes = StudentMentorThread.schema.indexes();
    const participantIndex = indexes.find(
      ([fields]) => fields.studentId === 1 && fields.mentorId === 1,
    );

    expect(participantIndex).toBeDefined();
    expect(participantIndex[1].unique).toBe(true);
  });

  it("should define the mentor status and recency index", () => {
    const indexes = StudentMentorThread.schema.indexes();
    const listingIndex = indexes.find(
      ([fields]) =>
        fields.mentorId === 1 &&
        fields.status === 1 &&
        fields.lastMessageAt === -1,
    );

    expect(listingIndex).toBeDefined();
  });

  it("should export all thread status values", () => {
    expect(MENTOR_THREAD_STATUS.ACTIVE).toBe("ACTIVE");
    expect(MENTOR_THREAD_STATUS.CLOSED).toBe("CLOSED");
  });
});
