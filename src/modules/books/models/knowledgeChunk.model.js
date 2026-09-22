import mongoose from "mongoose";

const { Schema, model } = mongoose;

const knowledgeChunkSchema = new Schema(
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

    blockIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "BookBlock",
      },
    ],

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
      bookTitle: {
        type: String,
        trim: true,
      },

      chapterTitle: {
        type: String,
        trim: true,
      },

      sourceLanguage: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

knowledgeChunkSchema.index({
  bookId: 1,
  chapterId: 1,
  chunkIndex: 1,
});

export const KnowledgeChunk = model(
  "KnowledgeChunk",
  knowledgeChunkSchema
);