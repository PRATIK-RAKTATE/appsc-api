import mongoose from "mongoose";
import { CouponValidationError, getCoursePurchaseAmount, validateCoupon } from "../services/coupon.service.js";
import { getInvoiceForOrder, InvoiceError, renderInvoicePdf } from "../services/invoice.service.js";
import { refundPayment, RefundError } from "../services/refund.service.js";
import {
  createCheckoutOrder,
  findCheckoutOrder,
  findWebhookOrder,
  markOrderPaid,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "../services/payment.service.js";

const sendError = (res, error, fallback) => {
  const status = error.statusCode || 500;
  if (status >= 500) console.error(fallback, error);
  return res.status(status).json({ success: false, message: status >= 500 ? fallback : error.message });
};

export const validateCouponController = async (req, res) => {
  try {
    const { couponCode, courseId, priceTierId } = req.body;
    if (!couponCode || !courseId) return res.status(400).json({ success: false, message: "couponCode and courseId are required" });
    const orderAmount = await getCoursePurchaseAmount({ courseId, priceTierId });
    const result = await validateCoupon({ code: couponCode, userId: req.user.userId, courseId, orderAmount });
    return res.status(200).json({
      success: true,
      data: {
        couponCode: result.coupon.code,
        subtotal: result.subtotal,
        discountAmount: result.discountAmount,
        finalAmount: result.finalAmount,
        currency: result.coupon.currency,
      },
    });
  } catch (error) {
    return sendError(res, error, "Unable to validate coupon");
  }
};

export const downloadInvoiceController = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.orderId)) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const data = await getInvoiceForOrder({ orderId: req.params.orderId, requester: req.user });
    const pdf = await renderInvoicePdf(data);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${data.invoice.invoiceNumber}.pdf`,
      "Content-Length": pdf.length,
    });
    return res.status(200).send(pdf);
  } catch (error) {
    return sendError(res, error, "Unable to generate invoice");
  }
};

export const refundPaymentController = async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount !== undefined && (typeof amount !== "number" || !Number.isFinite(amount))) {
      return res.status(400).json({ success: false, message: "Refund amount must be a number" });
    }
    const data = await refundPayment({ paymentId: req.params.paymentId, amount });
    return res.status(200).json({ success: true, message: "Refund created successfully", data });
  } catch (error) {
    return sendError(res, error, "Unable to create refund");
  }
};

export const createOrderController = async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: "courseId is required" });

    const data = await createCheckoutOrder({ userId: req.user.userId, courseId });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Unable to create payment order");
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    const { razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Razorpay order, payment, and signature are required" });
    }
    if (!verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
      return res.status(400).json({ success: false, message: "Invalid Razorpay payment signature" });
    }

    const order = await findCheckoutOrder({ razorpayOrderId, userId: req.user.userId });
    await markOrderPaid({
      order,
      razorpayPaymentId,
      razorpaySignature,
      metadata: { source: "checkout" },
    });
    return res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    return sendError(res, error, "Unable to verify payment");
  }
};

export const razorpayWebhookController = async (req, res) => {
  const rawBody = req.body;
  const signature = req.headers["x-razorpay-signature"];

  if (!Buffer.isBuffer(rawBody) || !verifyWebhookSignature({ rawBody, signature })) {
    return res.status(401).json({ success: false, message: "Invalid Razorpay webhook signature" });
  }

  try {
    const event = JSON.parse(rawBody.toString("utf8"));
    if (!['payment.captured', 'order.paid'].includes(event.event)) {
      return res.status(200).json({ success: true, message: "Webhook event ignored" });
    }

    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id || event.payload?.order?.entity?.id;
    const razorpayPaymentId = payment?.id;
    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(200).json({ success: true, message: "Webhook event ignored" });
    }

    const order = await findWebhookOrder({ razorpayOrderId });
    if (!order) return res.status(200).json({ success: true, message: "Webhook event ignored" });

    await markOrderPaid({
      order,
      razorpayPaymentId,
      metadata: { source: "webhook", event: event.event, paymentMethod: payment.method },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return sendError(res, error, "Unable to process Razorpay webhook");
  }
};
