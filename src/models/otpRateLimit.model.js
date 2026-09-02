import mongoose from "mongoose";

const otpRateLimitSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    ip: {
      type: String,
      required: true,
    },

    requestCount: {
      type: Number,
      default: 0,
    },

    windowStartedAt: {
      type: Date,
      default: Date.now,
    },

    lastRequestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One rate-limit record per email + IP combination
otpRateLimitSchema.index(
  { email: 1, ip: 1 },
  { unique: true }
);

export const OTPRateLimit = mongoose.model(
  "OTPRateLimit",
  otpRateLimitSchema
);