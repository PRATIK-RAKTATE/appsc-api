import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import examRoutes from "../routes/exam.routes.js";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { Topic } from "../models/topic.model.js";
import { Subject } from "../models/subject.model.js";
import { getLongitudinalAnalytics } from "../services/exam.service.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;
const MOCK_USER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_USER_ID = new mongoose.Types.ObjectId().toString();
let currentUserId = MOCK_USER_ID;

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
    req.user = { userId: currentUserId };
    next();
  },
  requireRole: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use("/api/exams", examRoutes);

describe("Longitudinal Exam Analytics & Weak Topics Engine (TASK-03.5.2)", () => {
  beforeEach(async () => {
    currentUserId = MOCK_USER_ID;
    await ExamAttempt.deleteMany({});
    await Test.deleteMany({});
    await TestSection.deleteMany({});
    await Question.deleteMany({});
    await Topic.deleteMany({});
    await Subject.deleteMany({});
  });

  const setupComprehensiveData = async () => {
    const subject1 = await Subject.create({
      _id: new mongoose.Types.ObjectId(),
      subjectName: "Quantitative Aptitude",
      subjectKey: "quant",
    });

    const subject2 = await Subject.create({
      _id: new mongoose.Types.ObjectId(),
      subjectName: "General Science",
      subjectKey: "science",
    });

    const topicAlgebra = await Topic.create({
      _id: new mongoose.Types.ObjectId(),
      topicName: "Algebra",
      topicKey: "algebra",
      subjectID: subject1._id,
    });

    const topicGeometry = await Topic.create({
      _id: new mongoose.Types.ObjectId(),
      topicName: "Geometry",
      topicKey: "geometry",
      subjectID: subject1._id,
    });

    const topicPhysics = await Topic.create({
      _id: new mongoose.Types.ObjectId(),
      topicName: "Physics",
      topicKey: "physics",
      subjectID: subject2._id,
    });

    const test1 = await Test.create({
      _id: new mongoose.Types.ObjectId(),
      title: "Prelims Mock 1",
      type: "MOCK_TEST",
      durationMinutes: 60,
      totalMarks: 100,
      createdBy: new mongoose.Types.ObjectId(),
    });

    const test2 = await Test.create({
      _id: new mongoose.Types.ObjectId(),
      title: "Prelims Mock 2",
      type: "MOCK_TEST",
      durationMinutes: 60,
      totalMarks: 100,
      createdBy: new mongoose.Types.ObjectId(),
    });

    // Create Questions for Algebra (Topic 1)
    const qAlg1 = await Question.create({
      _id: new mongoose.Types.ObjectId(),
      subjectID: subject1._id,
      topicID: topicAlgebra._id,
      subTopic: new mongoose.Types.ObjectId(),
      question: { en: "What is x if 2x=4?", te: "2x=4 అయితే x ఎంత?" },
      option: [
        { key: "A", text: { en: "1", te: "1" }, weight: 1 },
        { key: "B", text: { en: "2", te: "2" }, weight: 1 },
        { key: "C", text: { en: "3", te: "3" }, weight: 1 },
        { key: "D", text: { en: "4", te: "4" }, weight: 1 },
      ],
      correctOption: "B",
      explaination: { en: "x = 4/2 = 2", te: "x = 4/2 = 2" },
    });

    const qAlg2 = await Question.create({
      _id: new mongoose.Types.ObjectId(),
      subjectID: subject1._id,
      topicID: topicAlgebra._id,
      subTopic: new mongoose.Types.ObjectId(),
      question: { en: "What is x if 3x=9?", te: "3x=9 అయితే x ఎంత?" },
      option: [
        { key: "A", text: { en: "2", te: "2" }, weight: 1 },
        { key: "B", text: { en: "3", te: "3" }, weight: 1 },
        { key: "C", text: { en: "4", te: "4" }, weight: 1 },
        { key: "D", text: { en: "5", te: "5" }, weight: 1 },
      ],
      correctOption: "B",
      explaination: { en: "x = 9/3 = 3", te: "x = 9/3 = 3" },
    });

    // Create Questions for Geometry (Topic 2)
    const qGeo1 = await Question.create({
      _id: new mongoose.Types.ObjectId(),
      subjectID: subject1._id,
      topicID: topicGeometry._id,
      subTopic: new mongoose.Types.ObjectId(),
      question: { en: "Sum of angles in a triangle?", te: "త్రిభుజంలోని కోణాల మొత్తం ఎంత?" },
      option: [
        { key: "A", text: { en: "90", te: "90" }, weight: 1 },
        { key: "B", text: { en: "180", te: "180" }, weight: 1 },
        { key: "C", text: { en: "270", te: "270" }, weight: 1 },
        { key: "D", text: { en: "360", te: "360" }, weight: 1 },
      ],
      correctOption: "B",
      explaination: { en: "Sum of angles = 180 deg", te: "కోణాల మొత్తం = 180" },
    });

    // Create Questions for Physics (Topic 3)
    const qPhys1 = await Question.create({
      _id: new mongoose.Types.ObjectId(),
      subjectID: subject2._id,
      topicID: topicPhysics._id,
      subTopic: new mongoose.Types.ObjectId(),
      question: { en: "Unit of Force?", te: "బలం ప్రమాణం?" },
      option: [
        { key: "A", text: { en: "Joule", te: "జౌల్" }, weight: 1 },
        { key: "B", text: { en: "Newton", te: "న్యూటన్" }, weight: 1 },
        { key: "C", text: { en: "Watt", te: "వాట్" }, weight: 1 },
        { key: "D", text: { en: "Pascal", te: "పాస్కల్" }, weight: 1 },
      ],
      correctOption: "B",
      explaination: { en: "Force unit is Newton", te: "బలం ప్రమాణం న్యూటన్" },
    });

    return {
      subject1,
      subject2,
      topicAlgebra,
      topicGeometry,
      topicPhysics,
      test1,
      test2,
      qAlg1,
      qAlg2,
      qGeo1,
      qPhys1,
    };
  };

  it("should return clean zeroed response in getLongitudinalAnalytics when user has no historical submitted attempts", async () => {
    const res = await getLongitudinalAnalytics(MOCK_USER_ID);

    expect(res.success).toBe(true);
    expect(res.totalAttempts).toBe(0);
    expect(res.summary).toEqual({
      totalAttempts: 0,
      totalQuestions: 0,
      attemptedCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      skippedCount: 0,
      accuracyPercentage: 0,
      masteryPercentage: 0,
    });
    expect(res.timeAnalysis).toEqual({
      totalTimeSpentSeconds: 0,
      avgTimeCorrectSeconds: 0,
      avgTimeIncorrectSeconds: 0,
      avgTimeSkippedSeconds: 0,
      avgTimePerQuestionSeconds: 0,
    });
    expect(res.topicMastery).toHaveLength(0);
    expect(res.weakTopics).toHaveLength(0);
    expect(res.revisionRecommendations).toHaveLength(0);
  });

  it("should ignore IN_PROGRESS and EXPIRED attempts and only aggregate SUBMITTED attempts in historical analytics", async () => {
    const { test1, qAlg1 } = await setupComprehensiveData();

    // In progress attempt
    await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId: test1._id,
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [
        { questionId: qAlg1._id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 40 },
      ],
    });

    // Expired attempt
    await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId: test1._id,
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 1000),
      responses: [
        { questionId: qAlg1._id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 50 },
      ],
    });

    const res = await getLongitudinalAnalytics(MOCK_USER_ID);
    expect(res.totalAttempts).toBe(0);
    expect(res.summary.totalQuestions).toBe(0);
  });

  it("should accurately aggregate multiple historical submitted attempts in single-attempt analytics endpoint", async () => {
    const { test1, test2, qAlg1, qAlg2, qGeo1, qPhys1 } = await setupComprehensiveData();

    // Historical Attempt 1 on test 1:
    // qAlg1: Correct (selected B, correct B, 10s)
    // qGeo1: Incorrect (selected A, correct B, 30s)
    await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId: test1._id,
      status: "SUBMITTED",
      submittedAt: new Date("2026-09-10T10:00:00Z"),
      expiresAt: new Date("2026-09-10T11:00:00Z"),
      responses: [
        { questionId: qAlg1._id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 10 },
        { questionId: qGeo1._id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 30 },
      ],
    });

    // Current Attempt 2 on test 2:
    // qAlg2: Incorrect (selected A, correct B, 20s)
    // qPhys1: Correct (selected B, correct B, 40s)
    // qGeo1: Skipped/Unattempted (selected null, 5s)
    const attempt2 = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId: test2._id,
      status: "SUBMITTED",
      submittedAt: new Date("2026-09-15T10:00:00Z"),
      expiresAt: new Date("2026-09-15T11:00:00Z"),
      responses: [
        { questionId: qAlg2._id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 20 },
        { questionId: qPhys1._id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 40 },
        { questionId: qGeo1._id, selectedOption: null, status: "NOT_VISITED", timeSpentSeconds: 5 },
      ],
    });

    // Request analytics for attempt 2 via standard endpoint
    const res = await request(app).get(`/api/exams/attempts/${attempt2._id}/analytics`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Single-attempt summary (preserved existing behavior for attempt 2)
    // 3 questions in attempt 2: 2 attempted (1 correct, 1 incorrect), 1 skipped
    const summary = res.body.summary;
    expect(summary.totalQuestions).toBe(3);
    expect(summary.attemptedCount).toBe(2);
    expect(summary.correctCount).toBe(1);
    expect(summary.incorrectCount).toBe(1);
    expect(summary.skippedCount).toBe(1);

    // Single-attempt time analysis (avg time on correct vs incorrect)
    const timeAnalysis = res.body.timeAnalysis;
    expect(timeAnalysis.totalTimeSpentSeconds).toBe(65);
    expect(timeAnalysis.avgTimeCorrectSeconds).toBe(40);
    expect(timeAnalysis.avgTimeIncorrectSeconds).toBe(20);
    expect(timeAnalysis.avgTimeSkippedSeconds).toBe(5);

    // Historical Longitudinal Topic Mastery across Attempt 1 and Attempt 2:
    const topicMastery = res.body.topicMastery;
    expect(topicMastery).toBeDefined();
    expect(topicMastery).toHaveLength(3);

    // Geometry: 2 questions historically across attempts (1 incorrect in att 1, 1 skipped in att 2)
    // accuracy = 0%
    const geoTopic = topicMastery.find(t => t.topicName === "Geometry");
    expect(geoTopic).toBeDefined();
    expect(geoTopic.totalQuestions).toBe(2);
    expect(geoTopic.correctCount).toBe(0);
    expect(geoTopic.incorrectCount).toBe(1);
    expect(geoTopic.accuracyPercentage).toBe(0);
    expect(geoTopic.status).toBe("WEAK");

    // Algebra: 2 questions historically (1 correct in att 1, 1 incorrect in att 2)
    // accuracy = 50%
    const algTopic = topicMastery.find(t => t.topicName === "Algebra");
    expect(algTopic).toBeDefined();
    expect(algTopic.totalQuestions).toBe(2);
    expect(algTopic.correctCount).toBe(1);
    expect(algTopic.incorrectCount).toBe(1);
    expect(algTopic.accuracyPercentage).toBe(50);
    expect(algTopic.status).toBe("MODERATE");

    // Physics: 1 question historically (1 correct)
    // accuracy = 100%
    const physTopic = topicMastery.find(t => t.topicName === "Physics");
    expect(physTopic).toBeDefined();
    expect(physTopic.accuracyPercentage).toBe(100);
    expect(physTopic.status).toBe("STRONG");

    // Weak topics diagnosis from historical data (< 50% accuracy):
    // Only Geometry has < 50% (0%)
    expect(res.body.weakTopics).toHaveLength(1);
    expect(res.body.weakTopics[0].topicName).toBe("Geometry");
    expect(res.body.weakTopics[0].recommendation).toContain("Geometry");

    // Revision recommendations
    expect(res.body.revisionRecommendations).toBeDefined();
    expect(res.body.revisionRecommendations).toHaveLength(1);
    expect(res.body.revisionRecommendations[0].topicName).toBe("Geometry");
  });

  it("should provide student answer, correct key, and bilingual explanation in review endpoint", async () => {
    const { test1, qAlg1 } = await setupComprehensiveData();

    const attempt = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId: test1._id,
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [
        { questionId: qAlg1._id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 15 },
      ],
    });

    const res = await request(app).get(`/api/exams/attempts/${attempt._id}/review`);

    expect(res.status).toBe(200);
    expect(res.body.reviewData).toHaveLength(1);
    const item = res.body.reviewData[0];

    // Acceptance criteria 1: student answer, correct key, bilingual explanation
    expect(item.studentAnswer).toBe("B");
    expect(item.selectedOption).toBe("B");
    expect(item.correctKey).toBe("B");
    expect(item.correctOption).toBe("B");
    expect(item.explanationEn).toBe("x = 4/2 = 2");
    expect(item.explanationTe).toBe("x = 4/2 = 2");
    expect(item.explanation).toEqual({ en: "x = 4/2 = 2", te: "x = 4/2 = 2" });
  });

  it("should enforce user isolation (User B attempts must not leak into User A's analytics)", async () => {
    const { test1, qPhys1 } = await setupComprehensiveData();

    // Attempt belonging to OTHER_USER_ID
    const otherAttempt = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(OTHER_USER_ID),
      testId: test1._id,
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [
        { questionId: qPhys1._id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 25 },
      ],
    });

    // MOCK_USER_ID should get 400 when trying to access OTHER_USER_ID's attempt
    const resForbidden = await request(app).get(`/api/exams/attempts/${otherAttempt._id}/analytics`);
    expect(resForbidden.status).toBe(400);
    expect(resForbidden.body.message).toBe("Attempt not found or unauthorized");

    // Switching context to OTHER_USER_ID succeeds
    currentUserId = OTHER_USER_ID;
    const resOther = await request(app).get(`/api/exams/attempts/${otherAttempt._id}/analytics`);
    expect(resOther.status).toBe(200);
    expect(resOther.body.summary.correctCount).toBe(1);
    expect(resOther.body.topicMastery).toHaveLength(1);
    expect(resOther.body.topicMastery[0].topicName).toBe("Physics");
  });
});
