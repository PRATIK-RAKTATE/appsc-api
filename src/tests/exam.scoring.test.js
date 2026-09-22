/**
 * exam.scoring.test.js
 *
 * Tests for:
 *   1. Scoring engine (scoring.service.js)          — pure-logic unit tests
 *   2. Leaderboard aggregation (leaderboardCron.js) — function-level tests
 *   3. Submit endpoint (POST /api/exams/attempts/:id/submit)
 *   4. Leaderboard endpoint (GET /api/exams/:testId/leaderboard)
 *
 * Uses vitest + supertest + MongoMemoryServer.  No real DB, no real network.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Auth middleware mock — must be declared before importing routes
// ---------------------------------------------------------------------------
const MOCK_USER_ID = new mongoose.Types.ObjectId().toString();
const MOCK_USER_2_ID = new mongoose.Types.ObjectId().toString();

vi.mock("../middleware/auth.middleware.js", () => ({
  verifyToken: (req, _res, next) => {
    req.user = { userId: MOCK_USER_ID };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
}));

import examRoutes from "../routes/exam.routes.js";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { Leaderboard } from "../models/leaderboard.model.js";
import { evaluateExamAttempt } from "../services/scoring.service.js";
import { aggregateLeaderboards } from "../jobs/leaderboardCron.js";

// ---------------------------------------------------------------------------
// In-memory Mongo setup
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Express app for HTTP tests
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use("/api/exams", examRoutes);

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

/**
 * Creates a test, one section, and N questions.
 * Returns { test, section, questions }.
 */
const seedTestWithQuestions = async ({
  marksPerQuestion = 1,
  negativeMarkingCoefficient = 0.25,
  totalMarks = 4,
  questionAnswers = ["B", "C", "A", "D"], // correctOption per question
} = {}) => {
  const testId = new mongoose.Types.ObjectId();
  const sectionId = new mongoose.Types.ObjectId();

  const test = await Test.create({
    _id: testId,
    title: "Scoring Test",
    type: "MOCK_TEST",
    durationMinutes: 60,
    totalMarks,
    createdBy: new mongoose.Types.ObjectId(),
  });

  const questions = await Promise.all(
    questionAnswers.map((correctOption) =>
      Question.create({
        subjectID: new mongoose.Types.ObjectId(),
        topicID: new mongoose.Types.ObjectId(),
        subTopic: new mongoose.Types.ObjectId(),
        question: { en: "Question?", te: "ప్రశ్న?" },
        option: [
          { key: "A", text: { en: "Option A", te: "ఎంపిక A" }, weight: 1 },
          { key: "B", text: { en: "Option B", te: "ఎంపిక B" }, weight: 1 },
          { key: "C", text: { en: "Option C", te: "ఎంపిక C" }, weight: 1 },
          { key: "D", text: { en: "Option D", te: "ఎంపిక D" }, weight: 1 },
        ],
        correctOption,
        explaination: { en: "Explanation", te: "వివరణ" },
      })
    )
  );

  const section = await TestSection.create({
    _id: sectionId,
    testId,
    name: "Section 1",
    order: 1,
    questionCount: questions.length,
    marksPerQuestion,
    negativeMarkingCoefficient,
    questions: questions.map((q) => q._id),
  });

  return { test, section, questions };
};

/**
 * Creates an in-progress ExamAttempt with the given responses.
 */
const createAttempt = async (userId, testId, responses) => {
  return ExamAttempt.create({
    userId,
    testId,
    status: "IN_PROGRESS",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    responses,
  });
};

// ===========================================================================
// 1. SCORING ENGINE — unit tests (direct service calls)
// ===========================================================================
describe("Scoring Engine — evaluateExamAttempt()", () => {
  beforeEach(async () => {
    await ExamAttempt.deleteMany({});
    await Test.deleteMany({});
    await TestSection.deleteMany({});
    await Question.deleteMany({});
  });

  it("calculates score correctly: correct +1, incorrect -0.25, unattempted 0", async () => {
    const { test, questions } = await seedTestWithQuestions({
      marksPerQuestion: 1,
      negativeMarkingCoefficient: 0.25,
      questionAnswers: ["B", "C", "A", "D"],
      totalMarks: 4,
    });

    const [q0, q1, q2, q3] = questions;

    // q0: correct (B), q1: incorrect (gave A, correct C), q2: unattempted, q3: correct (D)
    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: q0._id, selectedOption: "B", timeSpentSeconds: 30 },
      { questionId: q1._id, selectedOption: "A", timeSpentSeconds: 20 },
      { questionId: q2._id, selectedOption: null, timeSpentSeconds: 0 },
      { questionId: q3._id, selectedOption: "D", timeSpentSeconds: 25 },
    ]);

    const scorecard = await evaluateExamAttempt(
      attempt._id.toString(),
      MOCK_USER_ID
    );

    // score = 1 (correct) - 0.25 (incorrect) + 0 (skip) + 1 (correct) = 1.75
    expect(scorecard.score).toBeCloseTo(1.75);
    expect(scorecard.correctCount).toBe(2);
    expect(scorecard.incorrectCount).toBe(1);
    expect(scorecard.unattemptedCount).toBe(1);
    expect(scorecard.totalTimeSeconds).toBe(75);
    expect(scorecard.idempotent).toBe(false);
  });

  it("calculates accuracy as correctCount / (correct + incorrect) * 100", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A", "B", "C"],
    });

    const [q0, q1, q2] = questions;

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: q0._id, selectedOption: "A", timeSpentSeconds: 10 }, // correct
      { questionId: q1._id, selectedOption: "A", timeSpentSeconds: 10 }, // incorrect (correct is B)
      { questionId: q2._id, selectedOption: null, timeSpentSeconds: 0 }, // unattempted
    ]);

    const scorecard = await evaluateExamAttempt(attempt._id.toString(), MOCK_USER_ID);

    // accuracy = 1 / (1+1) * 100 = 50
    expect(scorecard.accuracy).toBeCloseTo(50);
  });

  it("sets accuracy to 0 when all questions are unattempted (avoids div-by-zero)", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A", "B"],
    });

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: questions[0]._id, selectedOption: null, timeSpentSeconds: 0 },
      { questionId: questions[1]._id, selectedOption: null, timeSpentSeconds: 0 },
    ]);

    const scorecard = await evaluateExamAttempt(attempt._id.toString(), MOCK_USER_ID);

    expect(scorecard.accuracy).toBe(0);
    expect(scorecard.score).toBe(0);
    expect(scorecard.unattemptedCount).toBe(2);
  });

  it("allows score to go negative (full negative marking scenario)", async () => {
    const { test, questions } = await seedTestWithQuestions({
      marksPerQuestion: 1,
      negativeMarkingCoefficient: 1, // full -1 for wrong
      questionAnswers: ["A", "A", "A"],
    });

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: questions[0]._id, selectedOption: "B" }, // wrong
      { questionId: questions[1]._id, selectedOption: "B" }, // wrong
      { questionId: questions[2]._id, selectedOption: "B" }, // wrong
    ]);

    const scorecard = await evaluateExamAttempt(attempt._id.toString(), MOCK_USER_ID);

    expect(scorecard.score).toBe(-3);
    expect(scorecard.incorrectCount).toBe(3);
    expect(Number.isFinite(scorecard.score)).toBe(true);
  });

  it("stores the scorecard persistently on the ExamAttempt document", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A"],
    });

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: questions[0]._id, selectedOption: "A" },
    ]);

    await evaluateExamAttempt(attempt._id.toString(), MOCK_USER_ID);

    const saved = await ExamAttempt.findById(attempt._id);
    expect(saved.status).toBe("SUBMITTED");
    expect(saved.score).toBe(1);
    expect(saved.correctCount).toBe(1);
    expect(saved.submittedAt).toBeInstanceOf(Date);
  });

  it("is idempotent: re-calling on a SUBMITTED attempt returns the same scorecard", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A"],
    });

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: questions[0]._id, selectedOption: "A" },
    ]);

    const first = await evaluateExamAttempt(attempt._id.toString(), MOCK_USER_ID);
    const second = await evaluateExamAttempt(attempt._id.toString(), MOCK_USER_ID);

    expect(second.idempotent).toBe(true);
    expect(second.score).toBe(first.score);
    expect(second.correctCount).toBe(first.correctCount);
    expect(second.submittedAt).toEqual(first.submittedAt);
  });

  it("rejects submission by a different user (IDOR guard)", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A"],
    });

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: questions[0]._id, selectedOption: "A" },
    ]);

    await expect(
      evaluateExamAttempt(attempt._id.toString(), MOCK_USER_2_ID)
    ).rejects.toThrow("Attempt not found or unauthorized");
  });

  it("rejects submission of an EXPIRED attempt", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A"],
    });

    const expiredAttempt = await ExamAttempt.create({
      userId: MOCK_USER_ID,
      testId: test._id,
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 1000),
      responses: [{ questionId: questions[0]._id, selectedOption: "A" }],
    });

    await expect(
      evaluateExamAttempt(expiredAttempt._id.toString(), MOCK_USER_ID)
    ).rejects.toThrow("Cannot submit an expired attempt");
  });
});

// ===========================================================================
// 2. LEADERBOARD AGGREGATION — aggregateLeaderboards()
// ===========================================================================
describe("Leaderboard Aggregation — aggregateLeaderboards()", () => {
  beforeEach(async () => {
    await ExamAttempt.deleteMany({});
    await Leaderboard.deleteMany({});
    await Test.deleteMany({});
    await TestSection.deleteMany({});
    await Question.deleteMany({});
  });

  const makeSubmittedAttempt = (overrides = {}) =>
    ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(),
      testId: new mongoose.Types.ObjectId(),
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 3600_000),
      submittedAt: new Date(),
      score: 5,
      totalMarks: 10,
      correctCount: 5,
      incorrectCount: 0,
      unattemptedCount: 0,
      accuracy: 100,
      totalTimeSeconds: 120,
      responses: [],
      ...overrides,
    });

  it("returns 0 when there are no submitted attempts", async () => {
    const count = await aggregateLeaderboards();
    expect(count).toBe(0);
  });

  it("creates a Leaderboard document with correct rankings", async () => {
    const testId = new mongoose.Types.ObjectId();
    const userId1 = new mongoose.Types.ObjectId();
    const userId2 = new mongoose.Types.ObjectId();

    await makeSubmittedAttempt({ testId, userId: userId1, score: 8, totalTimeSeconds: 100 });
    await makeSubmittedAttempt({ testId, userId: userId2, score: 5, totalTimeSeconds: 80 });

    await aggregateLeaderboards();

    const lb = await Leaderboard.findOne({ testId });
    expect(lb).not.toBeNull();
    expect(lb.rankings).toHaveLength(2);
    expect(lb.rankings[0].score).toBe(8);
    expect(lb.rankings[0].rank).toBe(1);
    expect(lb.rankings[1].rank).toBe(2);
  });

  it("deduplicates to one entry per user, keeping the best score", async () => {
    const testId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    // Same user, two attempts — second one is better
    await makeSubmittedAttempt({ testId, userId, score: 4, totalTimeSeconds: 200 });
    await makeSubmittedAttempt({ testId, userId, score: 9, totalTimeSeconds: 150 });

    await aggregateLeaderboards();

    const lb = await Leaderboard.findOne({ testId });
    expect(lb.rankings).toHaveLength(1);
    expect(lb.rankings[0].score).toBe(9);
  });

  it("breaks ties by totalTimeSeconds ASC", async () => {
    const testId = new mongoose.Types.ObjectId();
    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();

    // Same score, user1 is faster
    await makeSubmittedAttempt({ testId, userId: user1, score: 7, totalTimeSeconds: 90 });
    await makeSubmittedAttempt({ testId, userId: user2, score: 7, totalTimeSeconds: 120 });

    await aggregateLeaderboards();

    const lb = await Leaderboard.findOne({ testId });
    expect(lb.rankings[0].userId.toString()).toBe(user1.toString());
    expect(lb.rankings[0].rank).toBe(1);
  });

  it("breaks ties by submittedAt ASC when score and time are equal", async () => {
    const testId = new mongoose.Types.ObjectId();
    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();

    const earlier = new Date(Date.now() - 30_000);
    const later = new Date();

    await makeSubmittedAttempt({ testId, userId: user1, score: 7, totalTimeSeconds: 100, submittedAt: earlier });
    await makeSubmittedAttempt({ testId, userId: user2, score: 7, totalTimeSeconds: 100, submittedAt: later });

    await aggregateLeaderboards();

    const lb = await Leaderboard.findOne({ testId });
    expect(lb.rankings[0].userId.toString()).toBe(user1.toString());
  });

  it("computes percentile correctly", async () => {
    const testId = new mongoose.Types.ObjectId();

    // 4 users with distinct scores
    await Promise.all([
      makeSubmittedAttempt({ testId, userId: new mongoose.Types.ObjectId(), score: 10 }),
      makeSubmittedAttempt({ testId, userId: new mongoose.Types.ObjectId(), score: 8 }),
      makeSubmittedAttempt({ testId, userId: new mongoose.Types.ObjectId(), score: 6 }),
      makeSubmittedAttempt({ testId, userId: new mongoose.Types.ObjectId(), score: 4 }),
    ]);

    await aggregateLeaderboards();

    const lb = await Leaderboard.findOne({ testId });
    // rank 1: percentile = (4 - 1) / 4 * 100 = 75
    expect(lb.rankings[0].percentile).toBeCloseTo(75);
    // rank 2: percentile = (4 - 2) / 4 * 100 = 50
    expect(lb.rankings[1].percentile).toBeCloseTo(50);
    // rank 4: percentile = (4 - 4) / 4 * 100 = 0
    expect(lb.rankings[3].percentile).toBe(0);
  });

  it("upserts: re-running aggregation updates the existing leaderboard", async () => {
    const testId = new mongoose.Types.ObjectId();
    await makeSubmittedAttempt({ testId, score: 5 });

    await aggregateLeaderboards();
    const lb1 = await Leaderboard.findOne({ testId });

    // Add another attempt and re-aggregate
    await makeSubmittedAttempt({ testId, score: 9 });
    await aggregateLeaderboards();
    const lb2 = await Leaderboard.findOne({ testId });

    // Should still be one leaderboard document, with 2 entries
    expect(lb2._id.toString()).toBe(lb1._id.toString());
    expect(lb2.rankings).toHaveLength(2);
    expect(lb2.rankings[0].score).toBe(9);
  });

  it("handles zero-submission tests gracefully (no crash)", async () => {
    // No attempts at all
    const count = await aggregateLeaderboards();
    expect(count).toBe(0);
  });
});

// ===========================================================================
// 3. SUBMIT ENDPOINT — POST /api/exams/attempts/:attemptId/submit
// ===========================================================================
describe("POST /api/exams/attempts/:attemptId/submit", () => {
  beforeEach(async () => {
    await ExamAttempt.deleteMany({});
    await Test.deleteMany({});
    await TestSection.deleteMany({});
    await Question.deleteMany({});
  });

  it("scores and returns a full scorecard on first submission", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A", "B", "C"],
      marksPerQuestion: 2,
      negativeMarkingCoefficient: 0.5,
      totalMarks: 6,
    });

    const [q0, q1, q2] = questions;

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: q0._id, selectedOption: "A", timeSpentSeconds: 15 }, // correct
      { questionId: q1._id, selectedOption: "A", timeSpentSeconds: 10 }, // incorrect
      { questionId: q2._id, selectedOption: null, timeSpentSeconds: 0 }, // unattempted
    ]);

    const res = await request(app)
      .post(`/api/exams/attempts/${attempt._id}/submit`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.score).toBeCloseTo(2 - 1); // +2 correct - 1 incorrect (2 * 0.5) = 1
    expect(data.correctCount).toBe(1);
    expect(data.incorrectCount).toBe(1);
    expect(data.unattemptedCount).toBe(1);
    expect(data.totalMarks).toBe(6);
    expect(data.idempotent).toBe(false);
    expect(data).toHaveProperty("submittedAt");
  });

  it("returns idempotent scorecard without recomputing if already SUBMITTED", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A"],
    });

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: questions[0]._id, selectedOption: "A" },
    ]);

    // First submission
    const res1 = await request(app)
      .post(`/api/exams/attempts/${attempt._id}/submit`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.idempotent).toBe(false);

    // Second submission — must be idempotent
    const res2 = await request(app)
      .post(`/api/exams/attempts/${attempt._id}/submit`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.idempotent).toBe(true);
    expect(res2.body.data.score).toBe(res1.body.data.score);
    expect(res2.body.message).toMatch(/already submitted/i);
  });

  it("returns 404 when the attempt does not belong to the authenticated user", async () => {
    const { test, questions } = await seedTestWithQuestions({ questionAnswers: ["A"] });

    // Attempt owned by a different user
    const attempt = await ExamAttempt.create({
      userId: MOCK_USER_2_ID,
      testId: test._id,
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() + 3600_000),
      responses: [{ questionId: questions[0]._id, selectedOption: "A" }],
    });

    const res = await request(app)
      .post(`/api/exams/attempts/${attempt._id}/submit`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when trying to submit an EXPIRED attempt", async () => {
    const { test, questions } = await seedTestWithQuestions({ questionAnswers: ["A"] });

    const attempt = await ExamAttempt.create({
      userId: MOCK_USER_ID,
      testId: test._id,
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 1000),
      responses: [{ questionId: questions[0]._id, selectedOption: "A" }],
    });

    const res = await request(app)
      .post(`/api/exams/attempts/${attempt._id}/submit`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });
});

// ===========================================================================
// 4. LEADERBOARD ENDPOINT — GET /api/exams/:testId/leaderboard
// ===========================================================================
describe("GET /api/exams/:testId/leaderboard", () => {
  beforeEach(async () => {
    await Leaderboard.deleteMany({});
    await ExamAttempt.deleteMany({});
  });

  it("returns empty leaderboard when no aggregation has run", async () => {
    const testId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/exams/${testId}/leaderboard`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rankings).toEqual([]);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.myRank).toBeNull();
  });

  it("returns paginated rankings after aggregation", async () => {
    const testId = new mongoose.Types.ObjectId();

    // Seed a leaderboard document directly
    await Leaderboard.create({
      testId,
      lastAggregatedAt: new Date(),
      rankings: Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        userId: new mongoose.Types.ObjectId(),
        attemptId: new mongoose.Types.ObjectId(),
        score: 10 - i,
        totalTimeSeconds: 100 + i * 10,
        accuracy: 90,
        percentile: 100 - (i + 1) * 10,
      })),
    });

    const res = await request(app)
      .get(`/api/exams/${testId}/leaderboard?page=1&limit=5`);

    expect(res.status).toBe(200);
    expect(res.body.data.rankings).toHaveLength(5);
    expect(res.body.data.total).toBe(10);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(5);
  });

  it("returns the authenticated user's own rank in myRank", async () => {
    const testId = new mongoose.Types.ObjectId();
    const myUserId = new mongoose.Types.ObjectId(MOCK_USER_ID);

    await Leaderboard.create({
      testId,
      lastAggregatedAt: new Date(),
      rankings: [
        {
          rank: 1,
          userId: new mongoose.Types.ObjectId(),
          attemptId: new mongoose.Types.ObjectId(),
          score: 10,
          totalTimeSeconds: 90,
          accuracy: 100,
          percentile: 100,
        },
        {
          rank: 2,
          userId: myUserId,
          attemptId: new mongoose.Types.ObjectId(),
          score: 8,
          totalTimeSeconds: 100,
          accuracy: 80,
          percentile: 50,
        },
        {
          rank: 3,
          userId: new mongoose.Types.ObjectId(),
          attemptId: new mongoose.Types.ObjectId(),
          score: 6,
          totalTimeSeconds: 110,
          accuracy: 60,
          percentile: 0,
        },
      ],
    });

    const res = await request(app)
      .get(`/api/exams/${testId}/leaderboard`);

    expect(res.status).toBe(200);
    expect(res.body.data.myRank).not.toBeNull();
    expect(res.body.data.myRank.rank).toBe(2);
    expect(res.body.data.myRank.score).toBe(8);
    expect(res.body.data.myRank.percentile).toBe(50);
  });

  it("returns myRank: null when the user has no entry in the leaderboard", async () => {
    const testId = new mongoose.Types.ObjectId();

    await Leaderboard.create({
      testId,
      lastAggregatedAt: new Date(),
      rankings: [
        {
          rank: 1,
          userId: new mongoose.Types.ObjectId(), // some other user
          attemptId: new mongoose.Types.ObjectId(),
          score: 10,
          totalTimeSeconds: 80,
          accuracy: 100,
          percentile: 100,
        },
      ],
    });

    const res = await request(app)
      .get(`/api/exams/${testId}/leaderboard`);

    expect(res.status).toBe(200);
    expect(res.body.data.myRank).toBeNull();
  });

  it("returns 400 for an invalid testId", async () => {
    const res = await request(app).get("/api/exams/not-a-valid-id/leaderboard");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });
});

// ===========================================================================
// 5. END-TO-END INTEGRATION: submit → aggregate → leaderboard
// ===========================================================================
describe("End-to-end: submit → aggregate → leaderboard", () => {
  beforeEach(async () => {
    await ExamAttempt.deleteMany({});
    await Leaderboard.deleteMany({});
    await Test.deleteMany({});
    await TestSection.deleteMany({});
    await Question.deleteMany({});
  });

  it("score appears in leaderboard after submission and aggregation", async () => {
    const { test, questions } = await seedTestWithQuestions({
      questionAnswers: ["A", "B"],
      marksPerQuestion: 1,
      negativeMarkingCoefficient: 0,
    });

    const attempt = await createAttempt(MOCK_USER_ID, test._id, [
      { questionId: questions[0]._id, selectedOption: "A" }, // correct
      { questionId: questions[1]._id, selectedOption: "B" }, // correct
    ]);

    // Submit via API
    const submitRes = await request(app)
      .post(`/api/exams/attempts/${attempt._id}/submit`);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.score).toBe(2);

    // Run the aggregation
    const upserted = await aggregateLeaderboards();
    expect(upserted).toBeGreaterThan(0);

    // Fetch leaderboard
    const lbRes = await request(app)
      .get(`/api/exams/${test._id}/leaderboard`);
    expect(lbRes.status).toBe(200);

    const { rankings, myRank } = lbRes.body.data;
    expect(rankings).toHaveLength(1);
    expect(rankings[0].score).toBe(2);
    expect(rankings[0].rank).toBe(1);
    expect(myRank).not.toBeNull();
    expect(myRank.rank).toBe(1);
  });
});
