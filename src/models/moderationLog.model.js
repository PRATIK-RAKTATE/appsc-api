import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const MODERATION_ACTION = {
  WARNING: "WARNING",
  MESSAGE_DELETED: "MESSAGE_DELETED",
  USER_MUTED: "USER_MUTED",
  USER_BANNED: "USER_BANNED",
  REPORT_DISMISSED: "REPORT_DISMISSED",
  ESCALATED: "ESCALATED",
};

const moderationLogSchema = new Schema(
  {
    chatReportId: {
      type: Schema.Types.ObjectId,
      ref: "ChatReport",
      index: true,
    },

    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },

    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      index: true,
    },

    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(MODERATION_ACTION),
      required: true,
      index: true,
    },

    actionTakenBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

moderationLogSchema.index({ action: 1, createdAt: -1 });
moderationLogSchema.index({ actionTakenBy: 1, createdAt: -1 });
moderationLogSchema.index({ chatId: 1, createdAt: -1 });
moderationLogSchema.index({ reportedUserId: 1, createdAt: -1 });
moderationLogSchema.index({ chatReportId: 1 });

moderationLogSchema.virtual("chatReport", {
  ref: "ChatReport",
  localField: "chatReportId",
  foreignField: "_id",
  justOne: true,
});

moderationLogSchema.virtual("chat", {
  ref: "Chat",
  localField: "chatId",
  foreignField: "_id",
  justOne: true,
});

moderationLogSchema.virtual("message", {
  ref: "Message",
  localField: "messageId",
  foreignField: "_id",
  justOne: true,
});

moderationLogSchema.virtual("reportedUser", {
  ref: "User",
  localField: "reportedUserId",
  foreignField: "_id",
  justOne: true,
});

moderationLogSchema.virtual("moderator", {
  ref: "User",
  localField: "actionTakenBy",
  foreignField: "_id",
  justOne: true,
});

export const ModerationLog = model(
  "ModerationLog",
  moderationLogSchema,
  "moderation_logs"
);
