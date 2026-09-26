import mongoose from "mongoose";

const { Schema, model } = mongoose;

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically delete OTP when expiresAt is reached
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const OTP = model("OTP", otpSchema);