import crypto from "crypto";
import { Course, COURSE_STATUS } from "../models/course.model.js";
import { Order, ORDER_STATUS } from "../models/order.model.js";
import { PaymentTransaction, PAYMENT_STATUS } from "../models/paymentTransaction.model.js";
import { UserEntitlement, ENTITLEMENT_STATUS } from "../models/userEntitlement.model.js";
import { getRazorpayClient } from "./razorpay.service.js";

export class PaymentError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const isMatchingHmac = ({ payload, signature, secret }) => {
  if (!payload || typeof signature !== "string" || !secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(signature, "hex");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

export const verifyCheckoutSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) =>
  isMatchingHmac({
    payload: `${razorpayOrderId}|${razorpayPaymentId}`,
    signature: razorpaySignature,
    secret: process.env.RAZORPAY_KEY_SECRET,
  });

export const verifyWebhookSignature = ({ rawBody, signature }) =>
  isMatchingHmac({
    payload: rawBody,
    signature,
    secret: process.env.RAZORPAY_WEBHOOK_SECRET,
  });

export const createCheckoutOrder = async ({ userId, courseId }) => {
  const course = await Course.findById(courseId).lean();
  if (!course || course.status !== COURSE_STATUS.PUBLISHED) {
    throw new PaymentError("Course is not available for purchase", 404);
  }

  const price = course.pricing?.salePrice ?? course.pricing?.amount;
  if (!Number.isFinite(price) || price < 0) {
    throw new PaymentError("Course has invalid pricing");
  }

  const currency = (course.pricing.currency || "INR").toUpperCase();
  const receipt = Order.generateReceipt();
  const razorpayOrder = await getRazorpayClient().orders.create({
    amount: Math.round(price * 100),
    currency,
    receipt,
    notes: { userId: String(userId), courseId: String(courseId) },
  });

  await Order.create({
    orderId: Order.generateOrderId(),
    userId,
    courseId: course._id,
    validityDays: course.validityDays,
    amount: price,
    currency,
    receipt,
    razorpayOrderId: razorpayOrder.id,
    status: ORDER_STATUS.CREATED,
    notes: { userId: String(userId), courseId: String(courseId) },
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

export const findCheckoutOrder = async ({ razorpayOrderId, userId }) => {
  const order = await Order.findOne({ razorpayOrderId, userId });
  if (!order) throw new PaymentError("Order not found", 404);
  return order;
};

export const findWebhookOrder = async ({ razorpayOrderId }) => Order.findOne({ razorpayOrderId });

export const markOrderPaid = async ({ order, razorpayPaymentId, razorpaySignature, metadata = {} }) => {
  const existingTransaction = await PaymentTransaction.findOne({ razorpayPaymentId });
  if (existingTransaction && String(existingTransaction.orderId) !== String(order._id)) {
    throw new PaymentError("Payment is already associated with another order", 409);
  }

  await Order.findOneAndUpdate(
    { _id: order._id, status: { $ne: ORDER_STATUS.PAID } },
    { $set: { status: ORDER_STATUS.PAID } },
    { new: true }
  );

  await PaymentTransaction.findOneAndUpdate(
    { razorpayPaymentId },
    {
      $setOnInsert: {
        orderId: order._id,
        userId: order.userId,
        courseId: order.courseId,
        razorpayPaymentId,
        razorpayOrderId: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency,
      },
      $set: {
        razorpaySignature,
        status: PAYMENT_STATUS.SUCCESS,
        captured: true,
        metadata,
      },
    },
    { new: true, upsert: true }
  );

  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setDate(expiresAt.getDate() + order.validityDays);

  await UserEntitlement.findOneAndUpdate(
    { userId: order.userId, courseId: order.courseId },
    {
      $set: {
        orderId: order._id,
        startsAt,
        expiresAt,
        status: ENTITLEMENT_STATUS.ACTIVE,
      },
    },
    { new: true, upsert: true }
  );
};
