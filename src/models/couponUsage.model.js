import mongoose from "mongoose";

const { Schema, model } = mongoose;

const couponUsageSchema = new Schema(
  {
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    discountApplied: {
      type: Number,
      required: true,
      min: 0,
    },

    orderAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ orderId: 1 }, { unique: true });

export const CouponUsage = model("CouponUsage", couponUsageSchema);
