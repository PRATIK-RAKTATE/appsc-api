import { beforeEach, describe, expect, it, vi } from "vitest";

const { couponFindOne, usageCount } = vi.hoisted(() => ({
  couponFindOne: vi.fn(),
  usageCount: vi.fn(),
}));

vi.mock("../models/coupon.model.js", () => ({
  COUPON_STATUS: { ACTIVE: "ACTIVE" },
  DISCOUNT_TYPE: { PERCENTAGE: "PERCENTAGE", FLAT: "FLAT" },
  Coupon: { findOne: couponFindOne },
}));
vi.mock("../models/couponUsage.model.js", () => ({
  CouponUsage: { countDocuments: usageCount },
}));
vi.mock("../models/course.model.js", () => ({
  COURSE_STATUS: { PUBLISHED: "PUBLISHED" },
  Course: { findById: vi.fn() },
}));

import { CouponValidationError, validateCoupon } from "../services/coupon.service.js";

describe("coupon validation service", () => {
  const baseCoupon = {
    _id: "coupon-id",
    code: "SAVE20",
    status: "ACTIVE",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 100,
    maxUsagePerUser: 1,
    applicableCourses: [],
    isValid: vi.fn(() => true),
    calculateDiscount: vi.fn(() => 200),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    couponFindOne.mockResolvedValue({ ...baseCoupon, isValid: vi.fn(() => true), calculateDiscount: vi.fn(() => 200) });
    usageCount.mockResolvedValue(0);
  });

  it("calculates the server-provided discount and never a client-provided value", async () => {
    const result = await validateCoupon({ code: " save20 ", userId: "user-1", courseId: "course-1", orderAmount: 1000 });
    expect(couponFindOne).toHaveBeenCalledWith({ code: "SAVE20" });
    expect(result).toMatchObject({ subtotal: 1000, discountAmount: 200, finalAmount: 800 });
  });

  it("rejects an unknown coupon", async () => {
    couponFindOne.mockResolvedValue(null);
    await expect(validateCoupon({ code: "NOPE", userId: "user-1", courseId: "course-1", orderAmount: 1000 }))
      .rejects.toMatchObject({ message: "Invalid coupon code", statusCode: 404 });
  });

  it("rejects a coupon after its per-user limit", async () => {
    usageCount.mockResolvedValue(1);
    await expect(validateCoupon({ code: "SAVE20", userId: "user-1", courseId: "course-1", orderAmount: 1000 }))
      .rejects.toBeInstanceOf(CouponValidationError);
  });

  it("caps a malformed discount at the payable amount", async () => {
    couponFindOne.mockResolvedValue({ ...baseCoupon, discountType: "FLAT", isValid: () => true, calculateDiscount: () => 5000 });
    const result = await validateCoupon({ code: "SAVE20", userId: "user-1", courseId: "course-1", orderAmount: 1000 });
    expect(result).toMatchObject({ discountAmount: 1000, finalAmount: 0 });
  });
});
