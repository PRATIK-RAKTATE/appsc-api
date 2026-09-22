import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  courseFindByIdMock,
  orderCreateMock,
  orderFindOneMock,
  orderFindOneAndUpdateMock,
  transactionFindOneMock,
  transactionFindOneAndUpdateMock,
  entitlementFindOneAndUpdateMock,
  razorpayOrderCreateMock,
} = vi.hoisted(() => ({
  courseFindByIdMock: vi.fn(),
  orderCreateMock: vi.fn(),
  orderFindOneMock: vi.fn(),
  orderFindOneAndUpdateMock: vi.fn(),
  transactionFindOneMock: vi.fn(),
  transactionFindOneAndUpdateMock: vi.fn(),
  entitlementFindOneAndUpdateMock: vi.fn(),
  razorpayOrderCreateMock: vi.fn(),
}));

vi.mock("../../courses/index.js", () => ({
  Course: { findById: courseFindByIdMock },
  COURSE_STATUS: { PUBLISHED: "PUBLISHED" },
}));

vi.mock("../models/order.model.js", () => ({
  Order: {
    create: orderCreateMock,
    findOne: orderFindOneMock,
    findOneAndUpdate: orderFindOneAndUpdateMock,
    generateOrderId: vi.fn(() => "ORD-20260914-ABC123"),
    generateReceipt: vi.fn(() => "rcpt_abc123"),
  },
  ORDER_STATUS: { CREATED: "CREATED", PAID: "PAID" },
}));

vi.mock("../models/paymentTransaction.model.js", () => ({
  PaymentTransaction: {
    findOne: transactionFindOneMock,
    findOneAndUpdate: transactionFindOneAndUpdateMock,
  },
  PAYMENT_STATUS: { SUCCESS: "SUCCESS" },
}));

vi.mock("../../entitlements/index.js", () => ({
  UserEntitlement: { findOneAndUpdate: entitlementFindOneAndUpdateMock },
  ENTITLEMENT_STATUS: { ACTIVE: "ACTIVE" },
}));

vi.mock("../services/razorpay.service.js", () => ({
  getRazorpayClient: () => ({ orders: { create: razorpayOrderCreateMock } }),
}));

import {
  createCheckoutOrder,
  markOrderPaid,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "../services/payment.service.js";

describe("payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "checkout-secret";
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
  });

  it("creates a Razorpay order from the published course sale price in paise", async () => {
    courseFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "course-1",
        status: "PUBLISHED",
        validityDays: 30,
        pricing: { amount: 2499, salePrice: 1999, currency: "INR" },
      }),
    });
    razorpayOrderCreateMock.mockResolvedValue({ id: "order_rzp_1", amount: 199900, currency: "INR" });
    orderCreateMock.mockResolvedValue({ _id: "local-order" });

    await expect(createCheckoutOrder({ userId: "user-1", courseId: "course-1" })).resolves.toEqual({
      orderId: "order_rzp_1",
      amount: 199900,
      currency: "INR",
      keyId: "rzp_test_key",
    });

    expect(razorpayOrderCreateMock).toHaveBeenCalledWith({
      amount: 199900,
      currency: "INR",
      receipt: "rcpt_abc123",
      notes: { userId: "user-1", courseId: "course-1" },
    });
    expect(orderCreateMock).toHaveBeenCalledWith(expect.objectContaining({
      status: "CREATED",
      amount: 1999,
      razorpayOrderId: "order_rzp_1",
    }));
  });

  it("accepts an authentic checkout signature and rejects a tampered one", () => {
    const body = "order_rzp_1|pay_rzp_1";
    const signature = crypto.createHmac("sha256", "checkout-secret").update(body).digest("hex");

    expect(verifyCheckoutSignature({ razorpayOrderId: "order_rzp_1", razorpayPaymentId: "pay_rzp_1", razorpaySignature: signature })).toBe(true);
    expect(verifyCheckoutSignature({ razorpayOrderId: "order_rzp_1", razorpayPaymentId: "pay_rzp_1", razorpaySignature: "f".repeat(64) })).toBe(false);
  });

  it("verifies the exact raw webhook bytes and rejects altered payloads", () => {
    const rawBody = Buffer.from('{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_rzp_1"}}}}');
    const signature = crypto.createHmac("sha256", "webhook-secret").update(rawBody).digest("hex");

    expect(verifyWebhookSignature({ rawBody, signature })).toBe(true);
    expect(verifyWebhookSignature({ rawBody: Buffer.from(`${rawBody} `), signature })).toBe(false);
  });

  it("marks an order paid once while safely upserting its transaction and enrollment", async () => {
    const order = {
      _id: "local-order",
      userId: "user-1",
      courseId: "course-1",
      razorpayOrderId: "order_rzp_1",
      amount: 1999,
      currency: "INR",
      validityDays: 30,
    };
    orderFindOneAndUpdateMock.mockResolvedValue({ ...order, status: "PAID" });
    transactionFindOneMock.mockResolvedValue(null);
    transactionFindOneAndUpdateMock.mockResolvedValue({ _id: "transaction-1" });
    entitlementFindOneAndUpdateMock.mockResolvedValue({ _id: "entitlement-1" });

    await markOrderPaid({ order, razorpayPaymentId: "pay_rzp_1", razorpaySignature: "signature", metadata: { source: "checkout" } });

    expect(orderFindOneAndUpdateMock).toHaveBeenCalledWith(
      { _id: "local-order", status: { $ne: "PAID" } },
      { $set: { status: "PAID" } },
      { new: true }
    );
    expect(transactionFindOneAndUpdateMock).toHaveBeenCalledWith(
      { razorpayPaymentId: "pay_rzp_1" },
      expect.objectContaining({ $setOnInsert: expect.objectContaining({ orderId: "local-order" }) }),
      { new: true, upsert: true }
    );
    expect(entitlementFindOneAndUpdateMock).toHaveBeenCalledWith(
      { userId: "user-1", courseId: "course-1" },
      expect.objectContaining({ $set: expect.objectContaining({ orderId: "local-order", status: "ACTIVE" }) }),
      { new: true, upsert: true }
    );
  });
});
