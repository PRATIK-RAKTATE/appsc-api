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
  BLUE: "BLUE",
  PINK: "PINK",
  PURPLE: "PURPLE",
  ORANGE: "ORANGE",
};

export const ANNOTATION_LANGUAGE = {
  ENGLISH: "ENGLISH",
  TELUGU: "TELUGU",
};

const rangeSchema = new Schema(
  {
    startOffset: {
      type: Number,
      min: 0,
      default: 0,
    },
    endOffset: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const studentAnnotationSchema = new Schema(
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
      index: true,
    },

    blockId: {
      type: Schema.Types.ObjectId,
      ref: "BookBlock",
      required: true,
      index: true,
    },

    blockNumber: {
      type: Number,
      min: 1,
    },

    type: {
      type: String,
      enum: Object.values(ANNOTATION_TYPE),
      required: true,
      default: ANNOTATION_TYPE.HIGHLIGHT,
      index: true,
    },

    color: {
      type: String,
      enum: Object.values(ANNOTATION_COLOR),
      default: ANNOTATION_COLOR.YELLOW,
      uppercase: true,
      trim: true,
    },

    range: {
      type: rangeSchema,
      default: () => ({ startOffset: 0, endOffset: 0 }),
    },

    selectedText: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    language: {
      type: String,
      enum: Object.values(ANNOTATION_LANGUAGE),
      default: ANNOTATION_LANGUAGE.ENGLISH,
      uppercase: true,
      trim: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

studentAnnotationSchema.index({ userId: 1, bookId: 1, type: 1 });
studentAnnotationSchema.index({ userId: 1, chapterId: 1 });
studentAnnotationSchema.index({ userId: 1, blockId: 1 });
studentAnnotationSchema.index({ bookId: 1, createdAt: -1 });

studentAnnotationSchema.virtual("studentId")
  .get(function () {
    return this.userId;
  })
  .set(function (val) {
    this.userId = val;
  });

studentAnnotationSchema.virtual("startOffset")
  .get(function () {
    return this.range?.startOffset;
  })
  .set(function (val) {
    if (!this.range) this.range = {};
    this.range.startOffset = val;
  });

studentAnnotationSchema.virtual("endOffset")
  .get(function () {
    return this.range?.endOffset;
  })
  .set(function (val) {
    if (!this.range) this.range = {};
    this.range.endOffset = val;
  });

studentAnnotationSchema.virtual("notes")
  .get(function () {
    return this.note;
  })
  .set(function (val) {
    this.note = val;
  });

studentAnnotationSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

studentAnnotationSchema.virtual("book", {
  ref: "Book",
  localField: "bookId",
  foreignField: "_id",
  justOne: true,
});

studentAnnotationSchema.virtual("chapter", {
  ref: "Chapter",
  localField: "chapterId",
  foreignField: "_id",
  justOne: true,
});

studentAnnotationSchema.virtual("block", {
  ref: "BookBlock",
  localField: "blockId",
  foreignField: "_id",
  justOne: true,
});

studentAnnotationSchema.pre("validate", function () {
  if (this.range && this.range.startOffset != null && this.range.endOffset != null) {
    if (this.range.endOffset < this.range.startOffset) {
      this.invalidate("range.endOffset", "endOffset cannot be less than startOffset");
    }
  }
});

export const StudentAnnotation = model(
  "StudentAnnotation",
  studentAnnotationSchema,
  "student_annotations"
);

export const Annotation = StudentAnnotation;

export default StudentAnnotation;
