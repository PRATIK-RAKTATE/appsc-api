import crypto from "crypto";
import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export const PAYMENT_METHOD = {
  UPI: "UPI",
  CARD: "CARD",
  NETBANKING: "NETBANKING",
  WALLET: "WALLET",
  EMI: "EMI",
  OTHER: "OTHER",
};

const paymentTransactionSchema = new Schema(
  {
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
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    razorpaySignature: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.OTHER,
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      required: true,
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    fee: {
      type: Number,
      min: 0,
    },

    tax: {
      type: Number,
      min: 0,
    },

    captured: {
      type: Boolean,
      default: false,
    },

    errorCode: {
      type: String,
      trim: true,
    },

    errorDescription: {
      type: String,
      trim: true,
    },

    webhookEventId: {
      type: String,
      trim: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentTransactionSchema.index({ orderId: 1, createdAt: -1 });
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ razorpayOrderId: 1 });
paymentTransactionSchema.index({ status: 1 });

paymentTransactionSchema.virtual("order", {
  ref: "Order",
  localField: "orderId",
  foreignField: "_id",
  justOne: true,
});

paymentTransactionSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

paymentTransactionSchema.virtual("course", {
  ref: "Course",
  localField: "courseId",
  foreignField: "_id",
  justOne: true,
});

paymentTransactionSchema.statics.verifyPaymentSignature = function ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  secret,
}) {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !secret) {
    return false;
  }
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");
  return expectedSignature === razorpaySignature;
};

paymentTransactionSchema.statics.verifyWebhookSignature = function ({
  rawBody,
  signature,
  secret,
}) {
  if (!rawBody || !signature || !secret) {
    return false;
  }
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody))
    .digest("hex");
  return expectedSignature === signature;
};

export const PaymentTransaction = model(
  "PaymentTransaction",
  paymentTransactionSchema
);
