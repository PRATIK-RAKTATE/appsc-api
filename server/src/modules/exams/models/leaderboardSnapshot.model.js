import { Schema, model } from "mongoose";

const leaderboardEntrySchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const leaderboardSnapshotSchema = new Schema(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },
    snapshotAt: {
      type: Date,
      required: true,
      index: true,
    },
    rankings: {
      type: [leaderboardEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

leaderboardSnapshotSchema.index(
  { testId: 1, snapshotAt: 1 },
  { unique: true }
);

export const LeaderboardSnapshot = model(
  "LeaderboardSnapshot",
  leaderboardSnapshotSchema
);