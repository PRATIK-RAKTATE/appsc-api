import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const REPORT_REASON = {
  HARASSMENT: "HARASSMENT",
  SPAM: "SPAM",
  HATE_SPEECH: "HATE_SPEECH",
  INAPPROPRIATE_CONTENT: "INAPPROPRIATE_CONTENT",
  VIOLENCE: "VIOLENCE",
  SCAM: "SCAM",
  OTHER: "OTHER",
};

export const REPORT_STATUS = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
};

const chatReportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },

    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: Object.values(REPORT_REASON),
      required: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      required: true,
      default: REPORT_STATUS.PENDING,
      index: true,
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    reviewedAt: {
      type: Date,
      index: true,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    resolution: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

chatReportSchema.index({ status: 1, createdAt: -1 });
chatReportSchema.index({ reporterId: 1, createdAt: -1 });
chatReportSchema.index({ reportedUserId: 1, createdAt: -1 });
chatReportSchema.index({ reporterId: 1, messageId: 1 });
chatReportSchema.index({ chatId: 1, createdAt: -1 });

chatReportSchema.virtual("reporter", {
  ref: "User",
  localField: "reporterId",
  foreignField: "_id",
  justOne: true,
});

chatReportSchema.virtual("reportedUser", {
  ref: "User",
  localField: "reportedUserId",
  foreignField: "_id",
  justOne: true,
});

chatReportSchema.virtual("reportedMessage", {
  ref: "Message",
  localField: "messageId",
  foreignField: "_id",
  justOne: true,
});

chatReportSchema.virtual("chat", {
  ref: "Chat",
  localField: "chatId",
  foreignField: "_id",
  justOne: true,
});

chatReportSchema.virtual("reviewer", {
  ref: "User",
  localField: "reviewedBy",
  foreignField: "_id",
  justOne: true,
});

export const ChatReport = model("ChatReport", chatReportSchema, "chat_reports");
