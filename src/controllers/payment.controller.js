import mongoose from "mongoose";
import { CouponValidationError, getCoursePurchaseAmount, validateCoupon } from "../services/coupon.service.js";
import { getInvoiceForOrder, InvoiceError, renderInvoicePdf } from "../services/invoice.service.js";
import { refundPayment, RefundError } from "../services/refund.service.js";

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
