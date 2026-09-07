import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  Order,
  ORDER_STATUS,
  ORDER_CURRENCY,
} from "../models/order.model.js";

describe("Order Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();
  const priceTierId = new mongoose.Types.ObjectId();

  const validOrder = {
    orderId: "ORD-20260907-001",
    userId,
    courseId,
    priceTierId,
    validityDays: 180,
    amount: 2999,
    currency: ORDER_CURRENCY.INR,
    receipt: "rcpt_20260907_001",
    razorpayOrderId: "order_Q1234567890",
    status: ORDER_STATUS.CREATED,
    notes: {
      studentPhone: "+919876543210",
      couponCode: "APPSC2026",
    },
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };

  it("should validate a completely valid order", async () => {
    const order = new Order(validOrder);
    await expect(order.validate()).resolves.toBeUndefined();
  });

  it("should apply default values for status, currency, and notes", () => {
    const order = new Order({
      orderId: "ORD-MINIMAL-01",
      userId,
      courseId,
      amount: 1999,
    });

    expect(order.status).toBe(ORDER_STATUS.PENDING);
    expect(order.currency).toBe(ORDER_CURRENCY.INR);
    expect(order.notes).toBeDefined();
  });

  it("should generate receipt and order IDs using statics", () => {
    const receipt = Order.generateReceipt();
    expect(receipt.startsWith("rcpt_")).toBe(true);
    expect(receipt.length).toBeLessThanOrEqual(40);

    const orderId = Order.generateOrderId();
    expect(orderId.startsWith("ORD-")).toBe(true);
  });

  it("should support status transitions via instance methods", () => {
    const order = new Order(validOrder);
    order.markAsPaid();
    expect(order.status).toBe(ORDER_STATUS.PAID);

    order.markAsFailed();
    expect(order.status).toBe(ORDER_STATUS.FAILED);
  });

  it("should require orderId", async () => {
    const order = new Order({
      ...validOrder,
      orderId: undefined,
    });

    await expect(order.validate()).rejects.toThrow(/orderId/i);
  });

  it("should require userId", async () => {
    const order = new Order({
      ...validOrder,
      userId: undefined,
    });

    await expect(order.validate()).rejects.toThrow(/userId/i);
  });

  it("should require courseId", async () => {
    const order = new Order({
      ...validOrder,
      courseId: undefined,
    });

    await expect(order.validate()).rejects.toThrow(/courseId/i);
  });

  it("should require amount", async () => {
    const order = new Order({
      ...validOrder,
      amount: undefined,
    });

    await expect(order.validate()).rejects.toThrow(/amount/i);
  });

  it("should reject negative amount", async () => {
    const order = new Order({
      ...validOrder,
      amount: -100,
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("should reject validityDays less than 1", async () => {
    const order = new Order({
      ...validOrder,
      validityDays: 0,
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("should reject invalid order status", async () => {
    const order = new Order({
      ...validOrder,
      status: "INVALID_ORDER_STATUS",
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("should reject receipt longer than 40 characters", async () => {
    const order = new Order({
      ...validOrder,
      receipt: "a".repeat(41),
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it("should correctly export constants", () => {
    expect(ORDER_STATUS.PENDING).toBe("PENDING");
    expect(ORDER_STATUS.CREATED).toBe("CREATED");
    expect(ORDER_STATUS.PAID).toBe("PAID");
    expect(ORDER_STATUS.FAILED).toBe("FAILED");
    expect(ORDER_STATUS.CANCELLED).toBe("CANCELLED");
    expect(ORDER_STATUS.REFUNDED).toBe("REFUNDED");
    expect(ORDER_CURRENCY.INR).toBe("INR");
  });
});
