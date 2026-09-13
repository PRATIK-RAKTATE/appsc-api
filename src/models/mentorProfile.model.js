import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const MENTOR_APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const credentialSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    institution: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
    },
  },
  { _id: false }
);

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
      trim: true,
      maxlength: 2000,
    },

    credentials: {
      type: [credentialSchema],
      default: [],
    },

    approvalStatus: {
      type: String,
      enum: Object.values(MENTOR_APPROVAL_STATUS),
      required: true,
      default: MENTOR_APPROVAL_STATUS.PENDING,
      index: true,
    },

    approvedAt: {
      type: Date,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

mentorProfileSchema.index({
  approvalStatus: 1,
  isActive: 1,
});

export const MentorProfile = model("MentorProfile", mentorProfileSchema);