import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const TRANSLATION_STATUS = {
  PENDING: "PENDING",
  TRANSLATED: "TRANSLATED",
  FAILED: "FAILED",
};

export const REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const bookBlockSchema = new Schema(
  {
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
      index: true,
    },

    blockNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    titleEn: {
      type: String,
      trim: true,
    },

    titleTe: {
      type: String,
      trim: true,
    },

    contentEn: {
      type: String,
      required: true,
      trim: true,
    },

    contentTe: {
      type: String,
      trim: true,
      default: null,
    },

    translationStatus: {
      type: String,
      enum: Object.values(TRANSLATION_STATUS),
      required: true,
      default: TRANSLATION_STATUS.PENDING,
    },

    reviewStatus: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      required: true,
      default: REVIEW_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

bookBlockSchema.index(
  { chapterId: 1, blockNumber: 1 },
  { unique: true }
);

bookBlockSchema.index(
  {
    titleEn: "text",
    titleTe: "text",
    contentEn: "text",
    contentTe: "text",
  },
  {
    weights: {
      titleEn: 5,
      titleTe: 5,
      contentEn: 1,
      contentTe: 1,
    },
    default_language: "none",
  }
);

export const BookBlock = model("BookBlock", bookBlockSchema);