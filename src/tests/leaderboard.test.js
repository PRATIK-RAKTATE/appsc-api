/**
 * Leaderboard Cron + API Tests
 *
 * Tests for aggregateLeaderboards() and the GET /api/exams/:testId/leaderboard endpoint.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import examRoutes from "../routes/exam.routes.js";
import { TestSubmission, SUBMISSION_STATUS } from "../models/testSubmission.model.js";
import { LeaderboardSnapshot } from "../models/leaderboardSnapshot.model.js";
import { aggregateLeaderboards } from "../jobs/leaderboardCron.js";

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

const makeSubmission = (studentId, testId, score, submittedAt) =>
  TestSubmission.create({
    studentId,
    testId,
    score,
    correctCount: 0,
    incorrectCount: 0,
    unattemptedCount: 0,
    status: SUBMISSION_STATUS.SUBMITTED,
    submittedAt: submittedAt ?? new Date(),
    answers: [],
  });

// ---------------------------------------------------------------------------
// aggregateLeaderboards() unit tests
// ---------------------------------------------------------------------------

describe("aggregateLeaderboards() – Cron Function", () => {
  beforeEach(async () => {
    await TestSubmission.deleteMany({});
    await LeaderboardSnapshot.deleteMany({});
  });

  it("should create a snapshot for a test with submissions", async () => {
    const testId = new mongoose.Types.ObjectId();
    const s1 = new mongoose.Types.ObjectId();
    const s2 = new mongoose.Types.ObjectId();

    await makeSubmission(s1, testId, 80);
    await makeSubmission(s2, testId, 60);

    const count = await aggregateLeaderboards();

    expect(count).toBe(1);

    const snapshot = await LeaderboardSnapshot.findOne({ testId });
    expect(snapshot).not.toBeNull();
    expect(snapshot.rankings).toHaveLength(2);
    expect(snapshot.rankings[0].rank).toBe(1);
    expect(snapshot.rankings[0].score).toBe(80);
    expect(snapshot.rankings[1].rank).toBe(2);
    expect(snapshot.rankings[1].score).toBe(60);
  });

  it("should assign the same rank to students with equal scores", async () => {
    const testId = new mongoose.Types.ObjectId();
    const s1 = new mongoose.Types.ObjectId();
    const s2 = new mongoose.Types.ObjectId();
    const s3 = new mongoose.Types.ObjectId();

    const now = new Date();
    await makeSubmission(s1, testId, 90, new Date(now.getTime() - 3000));
    await makeSubmission(s2, testId, 90, new Date(now.getTime() - 1000)); // same score, later
    await makeSubmission(s3, testId, 70);

    await aggregateLeaderboards();

    const snapshot = await LeaderboardSnapshot.findOne({ testId });
    const [r1, r2, r3] = snapshot.rankings;

    // Both with score 90 share rank 1; score 70 gets rank 3 (standard ranking)
    expect(r1.rank).toBe(1);
    expect(r2.rank).toBe(1);
    expect(r3.rank).toBe(3);
  });

  it("should sort by submittedAt ascending as tiebreaker within same score", async () => {
    const testId = new mongoose.Types.ObjectId();
    const s1 = new mongoose.Types.ObjectId();
    const s2 = new mongoose.Types.ObjectId();

    const earlier = new Date(Date.now() - 5000);
    const later = new Date(Date.now() - 1000);

    await makeSubmission(s1, testId, 75, later);
    await makeSubmission(s2, testId, 75, earlier);

    await aggregateLeaderboards();

    const snapshot = await LeaderboardSnapshot.findOne({ testId });
    // s2 submitted earlier, so they come first in the sorted list
    expect(snapshot.rankings[0].studentId.toString()).toBe(s2.toString());
  });

  it("should return 0 when no submitted submissions exist", async () => {
    const count = await aggregateLeaderboards();
    expect(count).toBe(0);
  });

  it("should upsert (not duplicate) snapshot on repeated runs within the same hour", async () => {
    const testId = new mongoose.Types.ObjectId();
    const s1 = new mongoose.Types.ObjectId();

    await makeSubmission(s1, testId, 50);

    await aggregateLeaderboards();
    await aggregateLeaderboards(); // second run in same hour

    const snapshotCount = await LeaderboardSnapshot.countDocuments({ testId });
    expect(snapshotCount).toBe(1);
  });

  it("should handle multiple tests independently", async () => {
    const testId1 = new mongoose.Types.ObjectId();
    const testId2 = new mongoose.Types.ObjectId();
    const s1 = new mongoose.Types.ObjectId();
    const s2 = new mongoose.Types.ObjectId();

    await makeSubmission(s1, testId1, 90);
    await makeSubmission(s2, testId2, 70);

    const count = await aggregateLeaderboards();

    expect(count).toBe(2);

    const snap1 = await LeaderboardSnapshot.findOne({ testId: testId1 });
    const snap2 = await LeaderboardSnapshot.findOne({ testId: testId2 });
    expect(snap1.rankings[0].score).toBe(90);
    expect(snap2.rankings[0].score).toBe(70);
  });
});

// ---------------------------------------------------------------------------
// GET /api/exams/:testId/leaderboard integration tests
// ---------------------------------------------------------------------------

describe("GET /api/exams/:testId/leaderboard – API", () => {
  beforeEach(async () => {
    await TestSubmission.deleteMany({});
    await LeaderboardSnapshot.deleteMany({});
  });

  it("should return 200 with snapshot data when a snapshot exists", async () => {
    const testId = new mongoose.Types.ObjectId();
    const s1 = new mongoose.Types.ObjectId();

    await makeSubmission(s1, testId, 85);
    await aggregateLeaderboards();

    const res = await request(app).get(`/api/exams/${testId}/leaderboard`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.rankings).toHaveLength(1);
    expect(res.body.rankings[0].rank).toBe(1);
    expect(res.body.rankings[0].score).toBe(85);
    expect(res.body.snapshotAt).toBeDefined();
  });

  it("should return empty rankings with a helpful message when no snapshot exists", async () => {
    const testId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`/api/exams/${testId}/leaderboard`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.rankings).toHaveLength(0);
    expect(res.body.snapshotAt).toBeNull();
    expect(res.body.message).toMatch(/updated hourly/i);
  });

  it("should respect the ?limit query param", async () => {
    const testId = new mongoose.Types.ObjectId();

    // Create 5 submissions
    for (let i = 0; i < 5; i++) {
      await makeSubmission(new mongoose.Types.ObjectId(), testId, 100 - i * 10);
    }
    await aggregateLeaderboards();

    const res = await request(app).get(`/api/exams/${testId}/leaderboard?limit=3`);

    expect(res.status).toBe(200);
    expect(res.body.rankings).toHaveLength(3);
  });

  it("should return the top-ranked student first", async () => {
    const testId = new mongoose.Types.ObjectId();
    const highScorer = new mongoose.Types.ObjectId();
    const lowScorer = new mongoose.Types.ObjectId();

    await makeSubmission(lowScorer, testId, 30);
    await makeSubmission(highScorer, testId, 95);
    await aggregateLeaderboards();

    const res = await request(app).get(`/api/exams/${testId}/leaderboard`);

    expect(res.status).toBe(200);
    expect(res.body.rankings[0].studentId.toString()).toBe(highScorer.toString());
    expect(res.body.rankings[0].rank).toBe(1);
  });
});
