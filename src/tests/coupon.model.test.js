import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  Coupon,
  COUPON_STATUS,
  DISCOUNT_TYPE,
} from "../models/coupon.model.js";

describe("Coupon Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();

  const validCoupon = {
    code: "SAVE20",
    discountType: DISCOUNT_TYPE.PERCENTAGE,
    discountValue: 20,
    minOrderAmount: 100,
    maxUsageCount: 100,
    maxUsagePerUser: 1,
    applicableCourses: [courseId],
    startsAt: new Date(Date.now() - 10000),
    expiresAt: new Date(Date.now() + 86400000),
    status: COUPON_STATUS.ACTIVE,
    createdBy: userId,
  };

  it("should validate a completely valid coupon", async () => {
    const coupon = new Coupon(validCoupon);

    await expect(coupon.validate()).resolves.toBeUndefined();
  });

  it("should apply default values", () => {
    const coupon = new Coupon({
      ...validCoupon,
      minOrderAmount: undefined,
      maxUsagePerUser: undefined,
      currentUsageCount: undefined,
      status: undefined,
    });

    expect(coupon.minOrderAmount).toBe(0);
    expect(coupon.maxUsagePerUser).toBe(1);
    expect(coupon.currentUsageCount).toBe(0);
    expect(coupon.status).toBe(COUPON_STATUS.ACTIVE);
  });

  it("should require code", async () => {
    const coupon = new Coupon({
      ...validCoupon,
      code: undefined,
    });

    await expect(coupon.validate()).rejects.toThrow(/code/i);
  });

  it("should require discountType", async () => {
    const coupon = new Coupon({
      ...validCoupon,
      discountType: undefined,
    });

    await expect(coupon.validate()).rejects.toThrow(/discountType/i);
  });

  it("should require discountValue", async () => {
    const coupon = new Coupon({
      ...validCoupon,
      discountValue: undefined,
    });

    await expect(coupon.validate()).rejects.toThrow(/discountValue/i);
  });

  it("should require expiresAt", async () => {
    const coupon = new Coupon({
      ...validCoupon,
      expiresAt: undefined,
    });

    await expect(coupon.validate()).rejects.toThrow(/expiresAt/i);
  });

  it("should require createdBy", async () => {
    const coupon = new Coupon({
      ...validCoupon,
      createdBy: undefined,
    });

    await expect(coupon.validate()).rejects.toThrow(/createdBy/i);
  });

  it("should reject invalid discount type", async () => {
    const coupon = new Coupon({
      ...validCoupon,
      discountType: "INVALID",
    });

    await expect(coupon.validate()).rejects.toThrow(/discountType/i);
  });

  it("should reject invalid coupon status", async () => {
    const coupon = new Coupon({
      ...validCoupon,
      status: "INVALID",
    });

    await expect(coupon.validate()).rejects.toThrow(/status/i);
  });

  it("should correctly validate an active coupon", () => {
    const coupon = new Coupon(validCoupon);

    expect(coupon.isValid()).toBe(true);
  });

  it("should reject an expired coupon", () => {
    const coupon = new Coupon({
      ...validCoupon,
      expiresAt: new Date(Date.now() - 10000),
    });

    expect(coupon.isValid()).toBe(false);
  });

  it("should reject a disabled coupon", () => {
    const coupon = new Coupon({
      ...validCoupon,
      status: COUPON_STATUS.DISABLED,
    });

    expect(coupon.isValid()).toBe(false);
  });

  it("should calculate percentage discount", () => {
    const coupon = new Coupon(validCoupon);

    expect(coupon.calculateDiscount(1000)).toBe(200);
  });

  it("should calculate flat discount", () => {
    const coupon = new Coupon({
      ...validCoupon,
      discountType: DISCOUNT_TYPE.FLAT,
      discountValue: 150,
    });

    expect(coupon.calculateDiscount(1000)).toBe(150);
  });

  it("should not exceed order amount", () => {
    const coupon = new Coupon({
      ...validCoupon,
      discountType: DISCOUNT_TYPE.FLAT,
      discountValue: 1500,
    });

    expect(coupon.calculateDiscount(1000)).toBe(1000);
  });

  it("should apply maximum discount limit", () => {
    const coupon = new Coupon({
      ...validCoupon,
      discountValue: 50,
      maxDiscountAmount: 100,
    });

    expect(coupon.calculateDiscount(1000)).toBe(100);
  });

  it("should return zero when minimum order amount is not met", () => {
    const coupon = new Coupon({
      ...validCoupon,
      minOrderAmount: 2000,
    });

    expect(coupon.calculateDiscount(1000)).toBe(0);
  });
});