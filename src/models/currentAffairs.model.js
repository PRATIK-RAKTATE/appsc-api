import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const CURRENT_AFFAIRS_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

export const RAG_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

const attachmentSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      default: "image",
    },
    caption: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const currentAffairsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 300,
    },

    summary: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) =>
        tags
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
    },

    status: {
      type: String,
      enum: Object.values(CURRENT_AFFAIRS_STATUS),
      default: CURRENT_AFFAIRS_STATUS.DRAFT,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    source: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    sourceUrl: {
      type: String,
      trim: true,
    },

    coverImageUrl: {
      type: String,
      trim: true,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    ragStatus: {
      type: String,
      enum: Object.values(RAG_STATUS),
      default: RAG_STATUS.PENDING,
      index: true,
    },

    ragIndexedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
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

// Useful for article search
currentAffairsSchema.index({
  title: "text",
  content: "text",
  tags: "text",
  summary: "text",
});

// Useful for published article queries
currentAffairsSchema.index({
  status: 1,
  publishedAt: -1,
});

// Useful for category + status queries
currentAffairsSchema.index({
  category: 1,
  status: 1,
  publishedAt: -1,
});

export const CurrentAffairs = model(
  "CurrentAffairs",
  currentAffairsSchema
);