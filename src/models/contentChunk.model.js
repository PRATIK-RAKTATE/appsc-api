import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ContentChunkSchema = new Schema(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "EBook",
      required: true,
      index: true,
    },
    chapterId: {
      type: String,
      default: null,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length > 0;
        },
        message: "Embedding vector must be a non-empty array of numbers.",
      },
    },
    metadata: {
      subject: { type: String, trim: true, index: true },
      topic: { type: String, trim: true },
      language: {
        type: String,
        enum: ["EN", "TE"],
        default: "EN",
        index: true,
      },
      pageNumber: { type: Number, min: 1 },
    },
  },
  {
    timestamps: true,
    collection: "contentchunks",
  },
);

/**
 * MongoDB Atlas Search Index Definition Reference:
 * Index Name: process.env.MONGODB_VECTOR_INDEX_NAME || 'vector_index'
 *
 * Atlas JSON Spec:
 * {
 *   "fields": [
 *     {
 *       "type": "vector",
 *       "path": "embedding",
 *       "numDimensions": 1536,
 *       "similarity": "cosine"
 *     },
 *     { "type": "filter", "path": "bookId" },
 *     { "type": "filter", "path": "metadata.subject" },
 *     { "type": "filter", "path": "metadata.language" }
 *   ]
 * }
 */

export const ContentChunk = model("ContentChunk", ContentChunkSchema);
