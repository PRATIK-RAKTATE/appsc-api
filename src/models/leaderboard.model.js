import { Schema, model } from "mongoose";

const rankingEntrySchema = new Schema(
  {
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: "ExamAttempt",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalTimeSeconds: {
      type: Number,
      required: true,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    percentile: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const leaderboardSchema = new Schema(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },
    lastAggregatedAt: {
      type: Date,
      default: Date.now,
    },
    rankings: {
      type: [rankingEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

leaderboardSchema.index({ testId: 1, lastAggregatedAt: -1 });

export const Leaderboard = model("Leaderboard", leaderboardSchema);
