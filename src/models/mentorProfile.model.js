import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const MENTOR_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

// Keep legacy alias so any existing code that imports MENTOR_APPROVAL_STATUS still works.
export const MENTOR_APPROVAL_STATUS = MENTOR_STATUS;

const mentorProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    bio: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    expertise: {
      type: [String],
      default: [],
      index: true,
    },

    qualifications: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(MENTOR_STATUS),
      required: true,
      default: MENTOR_STATUS.PENDING,
      index: true,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    maxMentees: {
      type: Number,
      default: 50,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

mentorProfileSchema.index({ status: 1, expertise: 1 });

export const MentorProfile = model("MentorProfile", mentorProfileSchema);
