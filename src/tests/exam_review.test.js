import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import examRoutes from "../routes/exam.routes.js";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { Topic } from "../models/topic.model.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

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

describe("Exam Review and Analytics API", () => {
  beforeEach(async () => {
    await ExamAttempt.deleteMany({});
    await Test.deleteMany({});
    await TestSection.deleteMany({});
    await Question.deleteMany({});
    await Topic.deleteMany({});
  });

  const setupTest = async () => {
    const subjectId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();
    await Topic.create({ 
      _id: topicId, 
      name: "Algebra", // wait, the model says topicName, not name
      topicName: "Algebra", 
      topicKey: "algebra", 
      subjectID: subjectId 
    });

    const testId = new mongoose.Types.ObjectId();
    await Test.create({
      _id: testId,
      title: "Math Test",
      type: "MOCK_TEST",
      durationMinutes: 60,
      totalMarks: 100,
      createdBy: new mongoose.Types.ObjectId(),
    });

    const sectionId = new mongoose.Types.ObjectId();
    await TestSection.create({
      _id: sectionId,
      testId,
      name: "Section 1",
      order: 1,
      questionCount: 2,
      marksPerQuestion: 10,
      negativeMarkingCoefficient: 0.25,
    });

    const q1Id = new mongoose.Types.ObjectId();
    const q2Id = new mongoose.Types.ObjectId();

    await Question.create([
      {
        _id: q1Id,
        subjectID: new mongoose.Types.ObjectId(),
        topicID: topicId,
        subTopic: new mongoose.Types.ObjectId(),
        question: { en: "1+1?", te: "1+1?" },
        option: [
          { key: "A", text: { en: "1", te: "1" }, weight: 1 },
          { key: "B", text: { en: "2", te: "2" }, weight: 1 },
          { key: "C", text: { en: "3", te: "3" }, weight: 1 },
          { key: "D", text: { en: "4", te: "4" }, weight: 1 },
        ],
        correctOption: "B",
        explaination: { en: "2", te: "2" },
      },
      {
        _id: q2Id,
        subjectID: new mongoose.Types.ObjectId(),
        topicID: topicId,
        subTopic: new mongoose.Types.ObjectId(),
        question: { en: "2+2?", te: "2+2?" },
        option: [
          { key: "A", text: { en: "3", te: "3" }, weight: 1 },
          { key: "B", text: { en: "4", te: "4" }, weight: 1 },
          { key: "C", text: { en: "5", te: "5" }, weight: 1 },
          { key: "D", text: { en: "6", te: "6" }, weight: 1 },
        ],
        correctOption: "B",
        explaination: { en: "4", te: "4" },
      },
    ]);

    await TestSection.findByIdAndUpdate(sectionId, { questions: [q1Id, q2Id] });

    return { testId, q1Id, q2Id, topicId };
  };

  it("should block review and analytics while test is IN_PROGRESS", async () => {
    const { testId } = await setupTest();
    const attempt = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId,
      status: "IN_PROGRESS",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [],
    });

    const resReview = await request(app).get(`/api/exams/attempts/${attempt._id}/review`);
    expect(resReview.status).toBe(403);
    expect(resReview.body.message).toContain("available only after test submission");

    const resAnalytics = await request(app).get(`/api/exams/attempts/${attempt._id}/analytics`);
    expect(resAnalytics.status).toBe(403);
  });

  it("should provide accurate review data after submission", async () => {
    const { testId, q1Id, q2Id } = await setupTest();
    const attempt = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId,
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [
        { questionId: q1Id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 10 },
        { questionId: q2Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 20 },
      ],
    });

    const res = await request(app).get(`/api/exams/attempts/${attempt._id}/review`);

    expect(res.status).toBe(200);
    const reviewData = res.body.reviewData;
    expect(reviewData).toHaveLength(2);

    const q1Review = reviewData.find(r => r.questionId.toString() === q1Id.toString());
    expect(q1Review.status).toBe("CORRECT");
    expect(q1Review.marksObtained).toBe(10);

    const q2Review = reviewData.find(r => r.questionId.toString() === q2Id.toString());
    expect(q2Review.status).toBe("INCORRECT");
    expect(q2Review.marksObtained).toBe(-2.5); // 10 * 0.25
  });

  it("should calculate analytics and weak topics correctly", async () => {
    const { testId, q1Id, q2Id } = await setupTest();
    const attempt = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId,
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [
        { questionId: q1Id, selectedOption: "B", status: "ANSWERED", timeSpentSeconds: 10 },
        { questionId: q2Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 20 },
      ],
    });

    const res = await request(app).get(`/api/exams/attempts/${attempt._id}/analytics`);

    expect(res.status).toBe(200);
    const { summary, timeAnalysis, weakTopics } = res.body;

    expect(summary.correctCount).toBe(1);
    expect(summary.incorrectCount).toBe(1);
    expect(summary.accuracyPercentage).toBe(50);
    expect(summary.totalScore).toBe(7.5);

    expect(timeAnalysis.avgTimeCorrectSeconds).toBe(10);
    expect(timeAnalysis.avgTimeIncorrectSeconds).toBe(20);

    // Accuracy is 50%, so it might not be marked as 'WEAK' depending on threshold (< 50).
    // Let's test another one where it is weak.
  });

  it("should flag weak topics when accuracy < 50%", async () => {
    const { testId, q1Id, q2Id } = await setupTest();
    const attempt = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(MOCK_USER_ID),
      testId,
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [
        { questionId: q1Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 10 },
        { questionId: q2Id, selectedOption: "A", status: "ANSWERED", timeSpentSeconds: 20 },
      ],
    });

    const res = await request(app).get(`/api/exams/attempts/${attempt._id}/analytics`);

    expect(res.status).toBe(200);
    expect(res.body.weakTopics).toHaveLength(1);
    expect(res.body.weakTopics[0].topicName).toBe("Algebra");
  });

  it("should prevent IDOR", async () => {
    const { testId } = await setupTest();
    const attempt = await ExamAttempt.create({
      userId: new mongoose.Types.ObjectId(), // different user
      testId,
      status: "SUBMITTED",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      responses: [],
    });

    const resReview = await request(app).get(`/api/exams/attempts/${attempt._id}/review`);
    expect(resReview.status).toBe(400);
    expect(resReview.body.message).toBe("Attempt not found or unauthorized");
  });
});
