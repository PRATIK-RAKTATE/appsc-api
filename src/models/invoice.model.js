import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  ISSUED: "ISSUED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

const lineItemSchema = new Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    hsnCode: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    lineItems: {
      type: [lineItemSchema],
      default: () => [],
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },

    taxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    cgst: {
      type: Number,
      min: 0,
      default: 0,
    },

    sgst: {
      type: Number,
      min: 0,
      default: 0,
    },

    igst: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalTax: {
      type: Number,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      required: true,
      default: INVOICE_STATUS.ISSUED,
      index: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    billingAddress: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true, default: "IN" },
    },

    sellerGstin: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    pdfUrl: {
      type: String,
      trim: true,
    },

    pdfKey: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ orderId: 1 });
invoiceSchema.index({ status: 1, issuedAt: -1 });

export const Invoice = model("Invoice", invoiceSchema);
