import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const BOOK_LANGUAGES = {
  ENGLISH: "ENGLISH",
  TELUGU: "TELUGU",
};

export const BOOK_STATUS = {
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  TRANSLATING: "TRANSLATING",
  IN_REVIEW: "IN_REVIEW",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
};

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },

    author: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    sourceLanguage: {
      type: String,
      enum: Object.values(BOOK_LANGUAGES),
      required: true,
      default: BOOK_LANGUAGES.ENGLISH,
    },

    targetLanguage: {
      type: String,
      enum: Object.values(BOOK_LANGUAGES),
      required: true,
      default: BOOK_LANGUAGES.TELUGU,
    },

    status: {
      type: String,
      enum: Object.values(BOOK_STATUS),
      required: true,
      default: BOOK_STATUS.UPLOADED,
      index: true,
    },

    sourceFile: {
      fileName: {
        type: String,
        trim: true,
      },
      fileUrl: {
        type: String,
        trim: true,
      },
      mimeType: {
        type: String,
        trim: true,
      },
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Book = model("Book", bookSchema);