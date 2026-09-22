import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Tracks daily AI query quota consumption per user.
 * One document per (userId, dateKey) pair.
 * Documents are automatically removed after 7 days via a TTL index on createdAt.
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
     * Acts as the daily partition key for quota resets.
     */
    dateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },

    /**
     * Number of AI queries (web searches) consumed today.
     */
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One record per user per day — guarantees atomic upsert safety
dailyAiUsageSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

// Auto-delete documents older than 7 days to keep the collection lean
dailyAiUsageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const DailyAiUsage = model("DailyAiUsage", dailyAiUsageSchema);
