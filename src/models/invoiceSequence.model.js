import mongoose from "mongoose";

const { Schema, model } = mongoose;

const invoiceSequenceSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "INV",
    },

    currentNumber: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

invoiceSequenceSchema.index({ key: 1 }, { unique: true });

export const InvoiceSequence = model(
  "InvoiceSequence",
  invoiceSequenceSchema
);