import mongoose from "mongoose";

const { Schema, model } = mongoose;

const currentAffairsChunkSchema = new Schema(
  {
    currentAffairsId: {
      type: Schema.Types.ObjectId,
      ref: "CurrentAffairs",
      required: true,
      index: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    embedding: {
      type: [Number],
      required: [true, "Embedding is required"],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "Embedding cannot be empty",
      },
    },

    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },

    tokenCount: {
      type: Number,
      required: true,
      min: 1,
    },

    metadata: {
      title: {
        type: String,
        trim: true,
      },
      categorySlug: {
        type: String,
        trim: true,
      },
      categoryName: {
        type: String,
        trim: true,
      },
      tags: {
        type: [String],
        default: [],
      },
      publishedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

currentAffairsChunkSchema.index({
  currentAffairsId: 1,
  chunkIndex: 1,
});

export const CurrentAffairsChunk = model(
  "CurrentAffairsChunk",
  currentAffairsChunkSchema
);
