import { Schema, model } from "mongoose";

export const ANSWER_STATUS = {
  CORRECT: "CORRECT",
  INCORRECT: "INCORRECT",
  UNATTEMPTED: "UNATTEMPTED",
};

export const SUBMISSION_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
};

const answerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOption: {
      type: Number,
      min: 0,
      max: 3,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ANSWER_STATUS),
      required: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const testSubmissionSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    correctCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    incorrectCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unattemptedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(SUBMISSION_STATUS),
      required: true,
      default: SUBMISSION_STATUS.IN_PROGRESS,
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

testSubmissionSchema.index({ studentId: 1, testId: 1 });
testSubmissionSchema.index({ testId: 1, submittedAt: -1 });

export const TestSubmission = model(
  "TestSubmission",
  testSubmissionSchema
);