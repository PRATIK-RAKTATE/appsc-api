import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const ANNOTATION_TYPE = {
  HIGHLIGHT: "HIGHLIGHT",
  NOTE: "NOTE",
  BOOKMARK: "BOOKMARK",
};

export const ANNOTATION_COLOR = {
  YELLOW: "YELLOW",
  GREEN: "GREEN",
  PINK: "PINK",
  BLUE: "BLUE",
  PURPLE: "PURPLE",
};

const annotationSchema = new Schema(
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
      type: String, // Or ObjectId, prompt said String/ObjectId
    },
    type: {
      type: String,
      enum: Object.values(ANNOTATION_TYPE),
      required: true,
    },
    cfiRange: {
      type: String,
      default: null,
    },
    pageNumber: {
      type: Number,
      default: null,
    },
    startOffset: {
      type: Number,
    },
    endOffset: {
      type: Number,
    },
    selectedText: {
      type: String,
    },
    color: {
      type: String,
      enum: Object.values(ANNOTATION_COLOR),
      default: ANNOTATION_COLOR.YELLOW,
    },
    noteText: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

annotationSchema.index({ userId: 1, bookId: 1, chapterId: 1 });

export const Annotation = model("Annotation", annotationSchema);

