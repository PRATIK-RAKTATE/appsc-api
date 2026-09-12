import mongoose from "mongoose";
import { Coupon, COUPON_STATUS, DISCOUNT_TYPE } from "../models/coupon.model.js";
import { CouponUsage } from "../models/couponUsage.model.js";
import { Course, COURSE_STATUS } from "../models/course.model.js";

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export class CouponValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const validateCoupon = async ({ code, userId, courseId, orderAmount }) => {
  if (typeof code !== "string" || !code.trim()) {
    throw new CouponValidationError("Coupon code is required");
  }
  if (!Number.isFinite(orderAmount) || orderAmount < 0) {
    throw new CouponValidationError("A valid order amount is required");
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) throw new CouponValidationError("Invalid coupon code", 404);
  if (coupon.status !== COUPON_STATUS.ACTIVE || !coupon.isValid()) {
    throw new CouponValidationError("Coupon is inactive, expired, or fully used");
  }
  if (
    coupon.discountType === DISCOUNT_TYPE.PERCENTAGE &&
    (coupon.discountValue <= 0 || coupon.discountValue > 100)
  ) {
    throw new CouponValidationError("Coupon has an invalid discount configuration");
  }
  if (orderAmount < coupon.minOrderAmount) {
    throw new CouponValidationError("Minimum order amount for this coupon is not met");
  }
  if (
    coupon.applicableCourses.length > 0 &&
    !coupon.applicableCourses.some((id) => id.toString() === courseId.toString())
  ) {
    throw new CouponValidationError("Coupon is not applicable to this course");
  }

  const userUsageCount = await CouponUsage.countDocuments({ couponId: coupon._id, userId });
  if (userUsageCount >= coupon.maxUsagePerUser) {
    throw new CouponValidationError("Coupon usage limit for this user has been reached");
  }

  const discountAmount = roundMoney(coupon.calculateDiscount(orderAmount));
  if (discountAmount <= 0) {
    throw new CouponValidationError("Coupon cannot be applied to this order");
  }

  return {
    coupon,
    subtotal: roundMoney(orderAmount),
    discountAmount: Math.min(discountAmount, roundMoney(orderAmount)),
    finalAmount: roundMoney(Math.max(0, orderAmount - discountAmount)),
  };
};

export const getCoursePurchaseAmount = async ({ courseId, priceTierId }) => {
  if (!mongoose.isValidObjectId(courseId)) {
    throw new CouponValidationError("A valid course ID is required");
  }
  const course = await Course.findById(courseId).lean();
  if (!course || course.status !== COURSE_STATUS.PUBLISHED) {
    throw new CouponValidationError("Course is not available for purchase", 404);
  }
  let price = course.pricing.salePrice ?? course.pricing.amount;
  if (priceTierId) {
    const tier = course.pricing.priceTiers.find((item) => item._id.toString() === priceTierId);
    if (!tier || !tier.isActive) throw new CouponValidationError("Selected price tier is not available");
    price = tier.salePrice ?? tier.price;
  }
  if (!Number.isFinite(price) || price < 0) throw new CouponValidationError("Course has invalid pricing");
  return roundMoney(price);
};
