import PDFDocument from "pdfkit";
import { Invoice, INVOICE_STATUS } from "../models/invoice.model.js";
import { InvoiceSequence } from "../models/invoiceSequence.model.js";
import { Order, ORDER_STATUS } from "../models/order.model.js";
import { PaymentTransaction, PAYMENT_STATUS } from "../models/paymentTransaction.model.js";
import { CouponUsage } from "../models/couponUsage.model.js";

export class InvoiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const money = (amount, currency = "INR") => `${currency} ${Number(amount || 0).toFixed(2)}`;

const nextInvoiceNumber = async () => {
  const sequence = await InvoiceSequence.findOneAndUpdate(
    { key: "invoice" },
    { $setOnInsert: { prefix: "INV" }, $inc: { currentNumber: 1 } },
    { new: true, upsert: true, runValidators: true }
  );
  return `${sequence.prefix}-${String(sequence.currentNumber).padStart(6, "0")}`;
};

export const getInvoiceForOrder = async ({ orderId, requester }) => {
  const order = await Order.findById(orderId)
    .populate("courseId", "title")
    .populate("userId", "name email")
    .lean();
  if (!order) throw new InvoiceError("Order not found", 404);
  if (!order.userId) throw new InvoiceError("Customer associated with this order was not found");
  const orderUserId = (order.userId._id || order.userId).toString();
  if (requester.role !== "ADMIN" && orderUserId !== requester.userId) {
    throw new InvoiceError("You do not have access to this invoice", 403);
  }
  if (order.status !== ORDER_STATUS.PAID) {
    throw new InvoiceError("Invoices are available only for paid orders");
  }
  if (!order.courseId) throw new InvoiceError("Course associated with this order was not found");

  const transaction = await PaymentTransaction.findOne({ orderId: order._id, status: PAYMENT_STATUS.SUCCESS }).lean();
  if (!transaction) throw new InvoiceError("Successful payment transaction not found");
  const usage = await CouponUsage.findOne({ orderId: order._id }).populate("couponId", "code").lean();

  let invoice = await Invoice.findOne({ orderId: order._id }).lean();
  if (!invoice) {
    const subtotal = usage?.orderAmount ?? order.amount;
    const discountAmount = usage?.discountApplied ?? 0;
    invoice = await Invoice.create({
      invoiceNumber: await nextInvoiceNumber(),
      orderId: order._id,
      userId: orderUserId,
      courseId: order.courseId._id || order.courseId,
      lineItems: [{ description: order.courseId.title || "Course purchase", quantity: 1, unitPrice: subtotal, amount: subtotal }],
      subtotal,
      discountAmount,
      couponId: usage?.couponId?._id,
      taxableAmount: Math.max(0, subtotal - discountAmount),
      totalAmount: order.amount,
      currency: order.currency,
      status: INVOICE_STATUS.ISSUED,
      billingAddress: { name: order.userId.name, email: order.userId.email },
    });
    invoice = invoice.toObject();
  }
  return { invoice, order, transaction, usage };
};

export const renderInvoicePdf = ({ invoice, order, transaction, usage }) =>
  new Promise((resolve, reject) => {
    try {
      const document = new PDFDocument({ margin: 48, size: "A4" });
      const chunks = [];
      document.on("data", (chunk) => chunks.push(chunk));
      document.on("end", () => resolve(Buffer.concat(chunks)));
      document.on("error", reject);
      document.fontSize(22).text("Invoice");
      document.moveDown().fontSize(10);
      document.text(`Invoice number: ${invoice.invoiceNumber}`);
      document.text(`Invoice date: ${new Date(invoice.issuedAt).toLocaleDateString("en-IN")}`);
      document.text(`Order: ${order.orderId}`);
      if (invoice.billingAddress?.name || invoice.billingAddress?.email) {
        document.text(`Customer: ${[invoice.billingAddress.name, invoice.billingAddress.email].filter(Boolean).join(" · ")}`);
      }
      document.moveDown().fontSize(12).text("Purchase details");
      document.fontSize(10).text(invoice.lineItems.map((item) => item.description).join(", "));
      document.moveDown();
      document.text(`Subtotal: ${money(invoice.subtotal, invoice.currency)}`);
      if (invoice.discountAmount > 0) document.text(`Discount${usage?.couponId?.code ? ` (${usage.couponId.code})` : ""}: -${money(invoice.discountAmount, invoice.currency)}`);
      document.text(`Total paid: ${money(invoice.totalAmount, invoice.currency)}`);
      document.moveDown().text(`Payment ID: ${transaction.razorpayPaymentId}`);
      document.text(`Razorpay order ID: ${transaction.razorpayOrderId}`);
      document.moveDown().fontSize(8).fillColor("grey").text("This is a computer-generated invoice.");
      document.end();
    } catch (error) {
      reject(error);
    }
  });
