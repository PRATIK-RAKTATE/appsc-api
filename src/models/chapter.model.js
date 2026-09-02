import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const CHAPTER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const chapterSchema = new Schema(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    chapterNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: Object.values(CHAPTER_STATUS),
      required: true,
      default: CHAPTER_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

chapterSchema.index(
  { bookId: 1, chapterNumber: 1 },
  { unique: true }
);

export const Chapter = model("Chapter", chapterSchema);