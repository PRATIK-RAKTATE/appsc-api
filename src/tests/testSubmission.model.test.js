import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  TestSubmission,
  ANSWER_STATUS,
  SUBMISSION_STATUS,
} from "../models/testSubmission.model.js";

describe("TestSubmission Schema", () => {
  const studentId = new mongoose.Types.ObjectId();
  const testId = new mongoose.Types.ObjectId();
  const questionId = new mongoose.Types.ObjectId();

  const validSubmission = {
    studentId,
    testId,
    answers: [
      {
        questionId,
        selectedOption: 1,
        status: ANSWER_STATUS.CORRECT,
        isCorrect: true,
        marksAwarded: 4,
      },
    ],
    score: 4,
    correctCount: 1,
    incorrectCount: 0,
    unattemptedCount: 0,
    status: SUBMISSION_STATUS.SUBMITTED,
    submittedAt: new Date(),
  };

  it("should create a valid submission", () => {
    const submission = new TestSubmission(validSubmission);

    expect(submission.validateSync()).toBeUndefined();
  });

  it("should require studentId", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      studentId: undefined,
    });

    const error = submission.validateSync();

    expect(error.errors.studentId).toBeDefined();
  });

  it("should require testId", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      testId: undefined,
    });

    const error = submission.validateSync();

    expect(error.errors.testId).toBeDefined();
  });

  it("should support correct answers", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      answers: [
        {
          questionId,
          selectedOption: 1,
          status: ANSWER_STATUS.CORRECT,
          isCorrect: true,
          marksAwarded: 4,
        },
      ],
    });

    expect(submission.validateSync()).toBeUndefined();
  });

  it("should support incorrect answers with negative marks", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      answers: [
        {
          questionId,
          selectedOption: 2,
          status: ANSWER_STATUS.INCORRECT,
          isCorrect: false,
          marksAwarded: -1,
        },
      ],
      score: 0,
    });

    expect(submission.validateSync()).toBeUndefined();
  });

  it("should support unattempted answers", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      answers: [
        {
          questionId,
          selectedOption: null,
          status: ANSWER_STATUS.UNATTEMPTED,
          isCorrect: false,
          marksAwarded: 0,
        },
      ],
    });

    expect(submission.validateSync()).toBeUndefined();
  });

  it("should reject invalid answer status", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      answers: [
        {
          questionId,
          selectedOption: 1,
          status: "INVALID",
          isCorrect: true,
          marksAwarded: 4,
        },
      ],
    });

    const error = submission.validateSync();

    expect(error.errors["answers.0.status"]).toBeDefined();
  });

  it("should reject invalid submission status", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      status: "INVALID",
    });

    const error = submission.validateSync();

    expect(error.errors.status).toBeDefined();
  });

  it("should reject negative score", () => {
    const submission = new TestSubmission({
      ...validSubmission,
      score: -10,
    });

    const error = submission.validateSync();

    expect(error.errors.score).toBeDefined();
  });

  it("should default submission status to IN_PROGRESS", () => {
    const submission = new TestSubmission({
      studentId,
      testId,
    });

    expect(submission.status).toBe(SUBMISSION_STATUS.IN_PROGRESS);
  });

  it("should default score to zero", () => {
    const submission = new TestSubmission({
      studentId,
      testId,
    });

    expect(submission.score).toBe(0);
  });
});