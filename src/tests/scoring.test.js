/**
 * Scoring Engine Tests
 *
 * Tests for the scoring logic introduced in submitExam() and the
 * immediate scorecard returned on submission.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import examRoutes from "../routes/exam.routes.js";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { TestSubmission } from "../models/testSubmission.model.js";
import { submitExam } from "../services/exam.service.js";

let mongoServer;
const MOCK_USER_ID = new mongoose.Types.ObjectId().toString();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

vi.mock("../middleware/auth.middleware.js", () => ({
  verifyToken: (req, res, next) => {
    req.user = { userId: MOCK_USER_ID };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use("/api/exams", examRoutes);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeQuestion = (id, correctOption = "B", subjectId, topicId, subTopicId) =>
  Question.create({
    _id: id,
    subjectID: subjectId ?? new mongoose.Types.ObjectId(),
    topicID: topicId ?? new mongoose.Types.ObjectId(),
    subTopic: subTopicId ?? new mongoose.Types.ObjectId(),
    question: { en: "Q?", te: "Q?" },
    option: [
      { key: "A", text: { en: "A", te: "A" }, weight: 1 },
      { key: "B", text: { en: "B", te: "B" }, weight: 1 },
      { key: "C", text: { en: "C", te: "C" }, weight: 1 },
      { key: "D", text: { en: "D", te: "D" }, weight: 1 },
    ],
    correctOption,
    explaination: { en: "Exp", te: "Exp" },
  });

const makeTest = (id) =>
  Test.create({
    _id: id,
    title: "Scoring Test",
    type: "MOCK_TEST",
    durationMinutes: 60,
    totalMarks: 100,
    createdBy: new mongoose.Types.ObjectId(),
  });

const makeSection = (testId, questions, marksPerQ, negCoeff = 0) =>
  TestSection.create({
    testId,
    name: "Section 1",
    order: 1,
    questionCount: questions.length,
    marksPerQuestion: marksPerQ,
    negativeMarkingCoefficient: negCoeff,
    questions,
  });

const makeAttempt = (userId, testId, responses, status = "IN_PROGRESS") =>
  ExamAttempt.create({
    userId,
    testId,
    status,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    responses,
  });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Scoring Engine – submitExam()", () => {
  beforeEach(async () => {
    await ExamAttempt.deleteMany({});
    await TestSubmission.deleteMany({});
    await Test.deleteMany({});
    await TestSection.deleteMany({});
    await Question.deleteMany({});
  });

  it("should award full marks for a correct answer", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "B");
    await makeSection(testId, [q1Id], 4, 0);

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 10 },
    ]);

    const result = await submitExam(attempt._id.toString(), MOCK_USER_ID);

    expect(result.success).toBe(true);
    expect(result.scorecard.score).toBe(4);
    expect(result.scorecard.correctCount).toBe(1);
    expect(result.scorecard.incorrectCount).toBe(0);
    expect(result.scorecard.unattemptedCount).toBe(0);
  });

  it("should deduct marks for an incorrect answer with negative marking", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "B");
    await makeSection(testId, [q1Id], 4, 0.25); // 4 marks, -1 for wrong

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 5 },
    ]);

    const result = await submitExam(attempt._id.toString(), MOCK_USER_ID);

    expect(result.scorecard.score).toBe(-1); // -(4 * 0.25)
    expect(result.scorecard.correctCount).toBe(0);
    expect(result.scorecard.incorrectCount).toBe(1);
  });

  it("should award zero marks for an unattempted question", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "B");
    await makeSection(testId, [q1Id], 4, 1);

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: null, status: "NOT_VISITED", timeSpentSeconds: 0 },
    ]);

    const result = await submitExam(attempt._id.toString(), MOCK_USER_ID);

    expect(result.scorecard.score).toBe(0);
    expect(result.scorecard.unattemptedCount).toBe(1);
    expect(result.scorecard.correctCount).toBe(0);
    expect(result.scorecard.incorrectCount).toBe(0);
  });

  it("should compute mixed scoring correctly: 2 correct, 1 incorrect, 1 unattempted", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();
    const q2Id = new mongoose.Types.ObjectId();
    const q3Id = new mongoose.Types.ObjectId();
    const q4Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "A");
    await makeQuestion(q2Id, "B");
    await makeQuestion(q3Id, "C");
    await makeQuestion(q4Id, "D");
    await makeSection(testId, [q1Id, q2Id, q3Id, q4Id], 2, 0.5); // 2 marks each, −1 for wrong

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 5 },   // correct  +2
      { questionId: q2Id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 5 },   // correct  +2
      { questionId: q3Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 5 },   // wrong    -1
      { questionId: q4Id, selectedOption: null, status: "NOT_VISITED", timeSpentSeconds: 0 }, // skip   0
    ]);

    const result = await submitExam(attempt._id.toString(), MOCK_USER_ID);

    expect(result.scorecard.score).toBe(3); // 2 + 2 - 1
    expect(result.scorecard.correctCount).toBe(2);
    expect(result.scorecard.incorrectCount).toBe(1);
    expect(result.scorecard.unattemptedCount).toBe(1);
    expect(result.scorecard.accuracyPercentage).toBe(
      Math.round((2 / 3) * 100 * 100) / 100
    );
  });

  it("should persist a TestSubmission document on submit", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "C");
    await makeSection(testId, [q1Id], 3, 0);

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "C", status: "ANSWERED", timeSpentSeconds: 8 },
    ]);

    await submitExam(attempt._id.toString(), MOCK_USER_ID);

    const submission = await TestSubmission.findOne({ studentId: MOCK_USER_ID, testId });
    expect(submission).not.toBeNull();
    expect(submission.score).toBe(3);
    expect(submission.correctCount).toBe(1);
    expect(submission.status).toBe("SUBMITTED");
    expect(submission.submittedAt).toBeInstanceOf(Date);
  });

  it("should mark ExamAttempt as SUBMITTED after scoring", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "A");
    await makeSection(testId, [q1Id], 5, 0);

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 3 },
    ]);

    await submitExam(attempt._id.toString(), MOCK_USER_ID);

    const updatedAttempt = await ExamAttempt.findById(attempt._id);
    expect(updatedAttempt.status).toBe("SUBMITTED");
    expect(updatedAttempt.submittedAt).toBeInstanceOf(Date);
  });

  it("should return scorecard immediately via the HTTP endpoint", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "D");
    await makeSection(testId, [q1Id], 5, 1);

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "D", status: "ANSWERED", timeSpentSeconds: 2 },
    ]);

    const res = await request(app).post(`/api/exams/attempts/${attempt._id}/submit`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scorecard).toBeDefined();
    expect(res.body.data.scorecard.score).toBe(5);
    expect(res.body.data.scorecard.correctCount).toBe(1);
  });

  it("should reject double-submission", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "A");
    await makeSection(testId, [q1Id], 4, 0);

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 5 },
    ]);

    // First submit
    await submitExam(attempt._id.toString(), MOCK_USER_ID);

    // Second submit should throw
    await expect(submitExam(attempt._id.toString(), MOCK_USER_ID)).rejects.toThrow(
      "Exam already submitted"
    );
  });

  it("should handle no negative marking (coefficient = 0) gracefully", async () => {
    const testId = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    await makeTest(testId);
    await makeQuestion(q1Id, "B");
    await makeSection(testId, [q1Id], 4, 0); // negCoeff = 0 means no penalty

    const attempt = await makeAttempt(MOCK_USER_ID, testId, [
      { questionId: q1Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 5 },
    ]);

    const result = await submitExam(attempt._id.toString(), MOCK_USER_ID);

    expect(result.scorecard.score).toBe(0); // wrong, but no penalty
    expect(result.scorecard.incorrectCount).toBe(1);
  });
});
