import { Order, ORDER_STATUS } from "../models/order.model.js";
import { PaymentTransaction, PAYMENT_STATUS } from "../models/paymentTransaction.model.js";
import { Invoice, INVOICE_STATUS } from "../models/invoice.model.js";
import { createRefund } from "./razorpay.service.js";
import mongoose from "mongoose";

export class RefundError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const refundPayment = async ({ paymentId, amount }) => {
  const identifiers = [{ razorpayPaymentId: paymentId }];
  if (mongoose.isValidObjectId(paymentId)) identifiers.push({ _id: paymentId });
  const transaction = await PaymentTransaction.findOne({
    $or: identifiers,
  });
  if (!transaction) throw new RefundError("Payment transaction not found", 404);
  if (transaction.status !== PAYMENT_STATUS.SUCCESS) {
    throw new RefundError("Payment is not eligible for a refund");
  }
  const order = await Order.findById(transaction.orderId);
  if (!order || order.status !== ORDER_STATUS.PAID) throw new RefundError("Associated order is not eligible for a refund");

  const remaining = roundMoney(transaction.amount - transaction.refundedAmount);
  const refundAmount = amount === undefined ? remaining : Number(amount);
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) throw new RefundError("Refund amount must be greater than zero");
  if (roundMoney(refundAmount) > remaining) throw new RefundError("Refund amount exceeds the remaining refundable amount");

  // Reserve the amount atomically before the provider request, preventing concurrent over-refunds.
  const reserved = await PaymentTransaction.findOneAndUpdate(
    { _id: transaction._id, status: PAYMENT_STATUS.SUCCESS, refundedAmount: { $lte: roundMoney(transaction.amount - refundAmount) } },
    { $inc: { refundedAmount: roundMoney(refundAmount) } },
    { new: true }
  );
  if (!reserved) throw new RefundError("A concurrent refund changed the refundable amount", 409);

  let providerRefund;
  try {
    providerRefund = await createRefund({ razorpayPaymentId: transaction.razorpayPaymentId, amount: refundAmount, receipt: `refund_${transaction._id}` });
  } catch (error) {
    await PaymentTransaction.updateOne({ _id: transaction._id }, { $inc: { refundedAmount: -roundMoney(refundAmount) } });
    throw new RefundError("Refund could not be created with the payment provider", 502);
  }

  const fullyRefunded = roundMoney(reserved.refundedAmount) >= roundMoney(reserved.amount);
  await PaymentTransaction.updateOne(
    { _id: transaction._id },
    { $push: { refunds: { razorpayRefundId: providerRefund.id, amount: refundAmount, status: providerRefund.status } }, ...(fullyRefunded ? { $set: { status: PAYMENT_STATUS.REFUNDED } } : {}) }
  );
  if (fullyRefunded) {
    await Order.updateOne({ _id: order._id }, { $set: { status: ORDER_STATUS.REFUNDED } });
    await Invoice.updateOne({ orderId: order._id }, { $set: { status: INVOICE_STATUS.REFUNDED } });
  }
  return { refund: providerRefund, refundedAmount: roundMoney(reserved.refundedAmount), remainingAmount: roundMoney(reserved.amount - reserved.refundedAmount) };
};
