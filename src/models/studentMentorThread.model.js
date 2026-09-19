import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const MENTOR_THREAD_STATUS = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
  PAUSED: "PAUSED",
};

const studentMentorThreadSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(MENTOR_THREAD_STATUS),
      required: true,
      default: MENTOR_THREAD_STATUS.ACTIVE,
      index: true,
    },

    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      index: true,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate threads for the same student–mentor pair.
studentMentorThreadSchema.index(
  { studentId: 1, mentorId: 1 },
  { unique: true }
);

// Efficient listing of a mentor's threads sorted by recent activity.
studentMentorThreadSchema.index({
  mentorId: 1,
  status: 1,
  lastMessageAt: -1,
});

export const StudentMentorThread = model(
  "StudentMentorThread",
  studentMentorThreadSchema
);
