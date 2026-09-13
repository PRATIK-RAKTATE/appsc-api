import { describe, it, expect } from "vitest";
import crypto from "crypto";
import mongoose from "mongoose";
import {
  PaymentTransaction,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
} from "../models/paymentTransaction.model.js";

describe("PaymentTransaction Model", () => {
  const orderId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();

  const secret = "test_razorpay_secret_key";
  const razorpayOrderId = "order_Q1234567890";
  const razorpayPaymentId = "pay_Q1234567890ABC";

  const validSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const validTransaction = {
    orderId,
    userId,
    courseId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature: validSignature,
    amount: 2999,
    currency: "INR",
    paymentMethod: PAYMENT_METHOD.UPI,
    status: PAYMENT_STATUS.SUCCESS,
    fee: 59.98,
    tax: 10.8,
    captured: true,
    webhookEventId: "evt_1234567890",
    metadata: {
      vpa: "student@okhdfcbank",
      bank: "HDFC",
    },
  };

  it("should validate a completely valid payment transaction", async () => {
    const transaction = new PaymentTransaction(validTransaction);
    await expect(transaction.validate()).resolves.toBeUndefined();
  });

  it("should verify authentic Razorpay payment signatures", () => {
    const isValid = PaymentTransaction.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: validSignature,
      secret,
    });
    expect(isValid).toBe(true);

    const isInvalid = PaymentTransaction.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: "invalid_tampered_signature",
      secret,
    });
    expect(isInvalid).toBe(false);
  });

  it("should verify authentic Razorpay webhook signatures", () => {
    const webhookPayload = JSON.stringify({ event: "payment.captured", paymentId: razorpayPaymentId });
    const webhookSecret = "webhook_secret_123";
    const webhookSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookPayload)
      .digest("hex");

    const isValid = PaymentTransaction.verifyWebhookSignature({
      rawBody: webhookPayload,
      signature: webhookSignature,
      secret: webhookSecret,
    });
    expect(isValid).toBe(true);

    const isInvalid = PaymentTransaction.verifyWebhookSignature({
      rawBody: webhookPayload,
      signature: "wrong_signature",
      secret: webhookSecret,
    });
    expect(isInvalid).toBe(false);
  });

  it("should apply default values for status, currency, and paymentMethod", () => {
    const transaction = new PaymentTransaction({
      orderId,
      userId,
      courseId,
      razorpayPaymentId: "pay_MINIMAL_01",
      razorpayOrderId: "order_MINIMAL_01",
      amount: 1999,
    });

    expect(transaction.status).toBe(PAYMENT_STATUS.PENDING);
    expect(transaction.currency).toBe("INR");
    expect(transaction.paymentMethod).toBe(PAYMENT_METHOD.OTHER);
    expect(transaction.captured).toBe(false);
  });

  it("should require orderId", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      orderId: undefined,
    });

    await expect(transaction.validate()).rejects.toThrow(/orderId/i);
  });

  it("should require userId", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      userId: undefined,
    });

    await expect(transaction.validate()).rejects.toThrow(/userId/i);
  });

  it("should require courseId", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      courseId: undefined,
    });

    await expect(transaction.validate()).rejects.toThrow(/courseId/i);
  });

  it("should require razorpayPaymentId", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      razorpayPaymentId: undefined,
    });

    await expect(transaction.validate()).rejects.toThrow(/razorpayPaymentId/i);
  });

  it("should require razorpayOrderId", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      razorpayOrderId: undefined,
    });

    await expect(transaction.validate()).rejects.toThrow(/razorpayOrderId/i);
  });

  it("should require amount", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      amount: undefined,
    });

    await expect(transaction.validate()).rejects.toThrow(/amount/i);
  });

  it("should reject negative amount", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      amount: -50,
    });

    await expect(transaction.validate()).rejects.toThrow();
  });

  it("should reject invalid payment status", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      status: "INVALID_STATUS",
    });

    await expect(transaction.validate()).rejects.toThrow();
  });

  it("should reject invalid payment method", async () => {
    const transaction = new PaymentTransaction({
      ...validTransaction,
      paymentMethod: "CRYPTO",
    });

    await expect(transaction.validate()).rejects.toThrow();
  });

  it("should correctly export enums and constants", () => {
    expect(PAYMENT_STATUS.PENDING).toBe("PENDING");
    expect(PAYMENT_STATUS.SUCCESS).toBe("SUCCESS");
    expect(PAYMENT_STATUS.FAILED).toBe("FAILED");
    expect(PAYMENT_STATUS.REFUNDED).toBe("REFUNDED");

    expect(PAYMENT_METHOD.UPI).toBe("UPI");
    expect(PAYMENT_METHOD.CARD).toBe("CARD");
    expect(PAYMENT_METHOD.NETBANKING).toBe("NETBANKING");
    expect(PAYMENT_METHOD.WALLET).toBe("WALLET");
    expect(PAYMENT_METHOD.EMI).toBe("EMI");
    expect(PAYMENT_METHOD.OTHER).toBe("OTHER");
  });
});
