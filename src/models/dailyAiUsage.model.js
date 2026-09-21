import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Tracks daily web-search quota consumption per user.
 * One document per (userId, date) pair.
 * The `date` field stores 'YYYY-MM-DD' in UTC so resets happen at midnight UTC.
 */
const dailyAiUsageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * UTC date string in 'YYYY-MM-DD' format.
     * Used as a natural key for daily partitioning.
     */
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    webSearchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Unique per user per day — ensures atomic upserts are safe
dailyAiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyAiUsage = model("DailyAiUsage", dailyAiUsageSchema);
