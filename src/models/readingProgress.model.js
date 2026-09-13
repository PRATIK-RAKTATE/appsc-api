import mongoose from "mongoose";

const { Schema, model } = mongoose;

const readingProgressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    chapterId: {
      type: Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },

    blockNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    scrollPosition: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    language: {
      type: String,
      enum: ["ENGLISH", "TELUGU"],
      default: "ENGLISH",
    },

    fontSize: {
      type: Number,
      min: 10,
      max: 40,
      default: 16,
    },

    theme: {
      type: String,
      enum: ["LIGHT", "DARK", "SEPIA"],
      default: "LIGHT",
    },
  },
  {
    timestamps: true,
  }
);

readingProgressSchema.index(
  { userId: 1, bookId: 1 },
  { unique: true }
);

export const ReadingProgress = model(
  "ReadingProgress",
  readingProgressSchema
);