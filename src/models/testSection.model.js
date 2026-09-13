
import mongoose, { Schema, model } from "mongoose";

const testSectionSchema = new Schema(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },

    marksPerQuestion: {
      type: Number,
      required: true,
      min: 0,
    },

    negativeMarkingCoefficient: {
      type: Number,
      default: 0,
      min: 0,
    },

    randomizeQuestions: {
      type: Boolean,
      default: false,
    },

    randomizeOptions: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// A test cannot have two sections with the same order.
testSectionSchema.index(
  { testId: 1, order: 1 },
  { unique: true }
);

export const TestSection = model("TestSection", testSectionSchema);
