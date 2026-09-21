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

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
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

    date: {
      type: Date,
      default: Date.now,
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

    thumbnailUrl: {
      type: String,
      trim: true,
    },

    attachments: {
      type: [attachmentSchema],
      default: [],
    },

    vectorIndexed: {
      type: Boolean,
      default: false,
      index: true,
    },

    vectorIndexedAt: {
      type: Date,
      default: null,
    },

    ragStatus: {
      type: String,
      enum: Object.values(RAG_STATUS),
      default: null,
      index: true,
    },

    ragIndexedAt: {
      type: Date,
      default: null,
    },

    semanticLinkStatus: {
      type: String,
      enum: Object.values(RAG_STATUS),
      default: null,
      index: true,
    },

    semanticLinkIndexedAt: {
      type: Date,
      default: null,
    },

    relatedChapters: {
      type: [
        {
          chapterId: {
            type: Schema.Types.ObjectId,
            ref: "Chapter",
            required: true,
          },
          score: {
            type: Number,
            required: true,
            min: 0,
            max: 1,
          },
          _id: false,
        },
      ],
      default: [],
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

currentAffairsSchema.pre('validate', async function() {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

currentAffairsSchema.index({
  title: "text",
  content: "text",
  tags: "text",
  summary: "text",
});

currentAffairsSchema.index({
  status: 1,
  publishedAt: -1,
});

currentAffairsSchema.index({
  category: 1,
  status: 1,
  publishedAt: -1,
});

export const CurrentAffairs = model(
  "CurrentAffairs",
  currentAffairsSchema
);
