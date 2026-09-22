import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const ORDER_STATUS = {
  PENDING: "PENDING",
  CREATED: "CREATED",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

export const ORDER_CURRENCY = {
  INR: "INR",
};

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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

    priceTierId: {
      type: Schema.Types.ObjectId,
    },

    validityDays: {
      type: Number,
      min: 1,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: Object.values(ORDER_CURRENCY),
      required: true,
      default: ORDER_CURRENCY.INR,
      uppercase: true,
      trim: true,
    },

    receipt: {
      type: String,
      trim: true,
      maxlength: 40,
    },

    razorpayOrderId: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      required: true,
      default: ORDER_STATUS.PENDING,
      index: true,
    },

    notes: {
      type: Map,
      of: String,
      default: () => new Map(),
    },

    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.virtual("transactions", {
  ref: "PaymentTransaction",
  localField: "_id",
  foreignField: "orderId",
});

orderSchema.statics.generateReceipt = function (prefix = "rcpt_") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}_${random}`.substring(0, 40);
};

orderSchema.statics.generateOrderId = function (prefix = "ORD-") {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${dateStr}-${random}`;
};

orderSchema.methods.markAsPaid = function () {
  this.status = ORDER_STATUS.PAID;
  return this;
};

orderSchema.methods.markAsFailed = function () {
  this.status = ORDER_STATUS.FAILED;
  return this;
};

export const Order = model("Order", orderSchema);
