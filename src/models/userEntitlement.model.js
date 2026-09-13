import mongoose from "mongoose";

const { Schema, model } = mongoose;

export const ENTITLEMENT_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
};

const userEntitlementSchema = new Schema(
  {
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

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

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
      enum: Object.values(ENTITLEMENT_STATUS),
      default: ENTITLEMENT_STATUS.ACTIVE,
      required: true,
      index: true,
    },

    notes: {
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

userEntitlementSchema.index({ userId: 1, courseId: 1 });
userEntitlementSchema.index({ expiresAt: 1 });

userEntitlementSchema.methods.isAccessValid = function () {
  return (
    this.status === ENTITLEMENT_STATUS.ACTIVE &&
    this.startsAt <= new Date() &&
    this.expiresAt > new Date()
  );
};

userEntitlementSchema.methods.markExpired = function () {
  this.status = ENTITLEMENT_STATUS.EXPIRED;
  return this;
};

export const UserEntitlement = model(
  "UserEntitlement",
  userEntitlementSchema
);
