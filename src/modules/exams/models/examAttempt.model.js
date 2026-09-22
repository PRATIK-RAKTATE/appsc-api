import mongoose, { Schema, model } from "mongoose";

const responseSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    selectedOption: {
      type: Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ["NOT_VISITED", "UNANSWERED", "ANSWERED", "MARKED_FOR_REVIEW", "ANSWERED_AND_MARKED_FOR_REVIEW"],
      default: "NOT_VISITED",
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const examAttemptSchema = new Schema(
  {
    userId: {
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
    status: {
      type: String,
      enum: ["IN_PROGRESS", "SUBMITTED", "EXPIRED"],
      default: "IN_PROGRESS",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    responses: [responseSchema],
  },
  {
    timestamps: true,
  }
);

examAttemptSchema.index({ userId: 1, testId: 1, status: 1 });

export const ExamAttempt = model("ExamAttempt", examAttemptSchema);
