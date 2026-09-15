import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createCheckoutOrderMock,
  verifyCheckoutSignatureMock,
  findCheckoutOrderMock,
  markOrderPaidMock,
  verifyWebhookSignatureMock,
  findWebhookOrderMock,
} = vi.hoisted(() => ({
  createCheckoutOrderMock: vi.fn(),
  verifyCheckoutSignatureMock: vi.fn(),
  findCheckoutOrderMock: vi.fn(),
  markOrderPaidMock: vi.fn(),
  verifyWebhookSignatureMock: vi.fn(),
  findWebhookOrderMock: vi.fn(),
}));

vi.mock("../services/payment.service.js", () => ({
  PaymentError: class PaymentError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  createCheckoutOrder: createCheckoutOrderMock,
  verifyCheckoutSignature: verifyCheckoutSignatureMock,
  findCheckoutOrder: findCheckoutOrderMock,
  markOrderPaid: markOrderPaidMock,
  verifyWebhookSignature: verifyWebhookSignatureMock,
  findWebhookOrder: findWebhookOrderMock,
}));

import {
  createOrderController,
  razorpayWebhookController,
  verifyPaymentController,
} from "../controllers/payment.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("payment controllers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns Razorpay checkout details for an authenticated course purchase", async () => {
    const res = createResponse();
    const data = { orderId: "order_rzp_1", amount: 199900, currency: "INR", keyId: "rzp_test_key" };
    createCheckoutOrderMock.mockResolvedValue(data);

    await createOrderController({ user: { userId: "user-1" }, body: { courseId: "course-1" } }, res);

    expect(createCheckoutOrderMock).toHaveBeenCalledWith({ userId: "user-1", courseId: "course-1" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it("does not update payment state when checkout HMAC is invalid", async () => {
    const res = createResponse();
    verifyCheckoutSignatureMock.mockReturnValue(false);

    await verifyPaymentController({
      user: { userId: "user-1" },
      body: { razorpay_order_id: "order_rzp_1", razorpay_payment_id: "pay_rzp_1", razorpay_signature: "bad" },
    }, res);

    expect(findCheckoutOrderMock).not.toHaveBeenCalled();
    expect(markOrderPaidMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("marks the authenticated order paid after a valid checkout HMAC", async () => {
    const res = createResponse();
    const order = { _id: "local-order" };
    verifyCheckoutSignatureMock.mockReturnValue(true);
    findCheckoutOrderMock.mockResolvedValue(order);

    await verifyPaymentController({
      user: { userId: "user-1" },
      body: { razorpay_order_id: "order_rzp_1", razorpay_payment_id: "pay_rzp_1", razorpay_signature: "valid" },
    }, res);

    expect(findCheckoutOrderMock).toHaveBeenCalledWith({ razorpayOrderId: "order_rzp_1", userId: "user-1" });
    expect(markOrderPaidMock).toHaveBeenCalledWith({
      order,
      razorpayPaymentId: "pay_rzp_1",
      razorpaySignature: "valid",
      metadata: { source: "checkout" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects an invalid webhook before parsing or changing payment state", async () => {
    const res = createResponse();
    const rawBody = Buffer.from('{"event":"payment.captured"}');
    verifyWebhookSignatureMock.mockReturnValue(false);

    await razorpayWebhookController({ headers: { "x-razorpay-signature": "bad" }, body: rawBody }, res);

    expect(findWebhookOrderMock).not.toHaveBeenCalled();
    expect(markOrderPaidMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("processes a verified payment.captured webhook once through the paid transition", async () => {
    const res = createResponse();
    const order = { _id: "local-order" };
    const body = Buffer.from(JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_rzp_1", order_id: "order_rzp_1", method: "upi" } } },
    }));
    verifyWebhookSignatureMock.mockReturnValue(true);
    findWebhookOrderMock.mockResolvedValue(order);

    await razorpayWebhookController({ headers: { "x-razorpay-signature": "valid" }, body }, res);

    expect(findWebhookOrderMock).toHaveBeenCalledWith({ razorpayOrderId: "order_rzp_1" });
    expect(markOrderPaidMock).toHaveBeenCalledWith(expect.objectContaining({
      order,
      razorpayPaymentId: "pay_rzp_1",
      metadata: expect.objectContaining({ source: "webhook", event: "payment.captured" }),
    }));
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
