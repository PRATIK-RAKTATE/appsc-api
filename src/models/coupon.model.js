import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const COUPON_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  DISABLED: "DISABLED",
};

export const DISCOUNT_TYPE = {
  PERCENTAGE: "PERCENTAGE",
  FLAT: "FLAT",
};

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      minlength: 3,
      maxlength: 30,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    discountType: {
      type: String,
      enum: Object.values(DISCOUNT_TYPE),
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    maxDiscountAmount: {
      type: Number,
      min: 0,
    },

    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    maxUsageCount: {
      type: Number,
      min: 1,
    },

    currentUsageCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    maxUsagePerUser: {
      type: Number,
      min: 1,
      default: 1,
    },

    applicableCourses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    startsAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(COUPON_STATUS),
      required: true,
      default: COUPON_STATUS.ACTIVE,
      index: true,
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

couponSchema.index({ status: 1, expiresAt: 1 });

couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.status === COUPON_STATUS.ACTIVE &&
    this.startsAt <= now &&
    this.expiresAt > now &&
    (this.maxUsageCount == null || this.currentUsageCount < this.maxUsageCount)
  );
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (!this.isValid()) return 0;
  if (orderAmount < this.minOrderAmount) return 0;

  let discount = 0;
  if (this.discountType === DISCOUNT_TYPE.PERCENTAGE) {
    discount = (orderAmount * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  if (this.maxDiscountAmount != null && discount > this.maxDiscountAmount) {
    discount = this.maxDiscountAmount;
  }

  return Math.min(discount, orderAmount);
};

export const Coupon = model("Coupon", couponSchema);
