import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { CouponUsage } from "../models/couponUsage.model.js";

describe("CouponUsage Model", () => {
  const couponId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();

  const validUsage = {
    couponId,
    userId,
    orderId,
    courseId,
    discountApplied: 200,
    orderAmount: 1000,
    finalAmount: 800,
  };

  it("should validate a completely valid coupon usage", async () => {
    const usage = new CouponUsage(validUsage);

    await expect(usage.validate()).resolves.toBeUndefined();
  });

  it("should require couponId", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      couponId: undefined,
    });

    await expect(usage.validate()).rejects.toThrow(/couponId/i);
  });

  it("should require userId", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      userId: undefined,
    });

    await expect(usage.validate()).rejects.toThrow(/userId/i);
  });

  it("should require orderId", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      orderId: undefined,
    });

    await expect(usage.validate()).rejects.toThrow(/orderId/i);
  });

  it("should require courseId", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      courseId: undefined,
    });

    await expect(usage.validate()).rejects.toThrow(/courseId/i);
  });

  it("should require discountApplied", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      discountApplied: undefined,
    });

    await expect(usage.validate()).rejects.toThrow(/discountApplied/i);
  });

  it("should require orderAmount", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      orderAmount: undefined,
    });

    await expect(usage.validate()).rejects.toThrow(/orderAmount/i);
  });

  it("should require finalAmount", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      finalAmount: undefined,
    });

    await expect(usage.validate()).rejects.toThrow(/finalAmount/i);
  });

  it("should reject negative discount", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      discountApplied: -100,
    });

    await expect(usage.validate()).rejects.toThrow(/discountApplied/i);
  });

  it("should reject negative order amount", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      orderAmount: -100,
    });

    await expect(usage.validate()).rejects.toThrow(/orderAmount/i);
  });

  it("should reject negative final amount", async () => {
    const usage = new CouponUsage({
      ...validUsage,
      finalAmount: -100,
    });

    await expect(usage.validate()).rejects.toThrow(/finalAmount/i);
  });
});