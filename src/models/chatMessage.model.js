import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const CHAT_MESSAGE_TYPE = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  FILE: "FILE",
  VOICE: "VOICE",
};

const attachmentSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
      trim: true,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    size: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const chatMessageSchema = new Schema(
  {
    threadId: {
      type: Schema.Types.ObjectId,
      ref: "StudentMentorThread",
      required: true,
      index: true,
    },

    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      trim: true,
    },

    messageType: {
      type: String,
      enum: Object.values(CHAT_MESSAGE_TYPE),
      required: true,
      default: CHAT_MESSAGE_TYPE.TEXT,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    deliveredAt: {
      type: Date,
    },

    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ threadId: 1, createdAt: 1 });
chatMessageSchema.index({ threadId: 1, readAt: 1, createdAt: -1 });

export const ChatMessage = model(
  "ChatMessage",
  chatMessageSchema,
  "chat_messages"
);

export default ChatMessage;
