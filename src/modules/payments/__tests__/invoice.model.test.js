import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  Invoice,
  INVOICE_STATUS,
} from "../models/invoice.model.js";

describe("Invoice Model", () => {
  const orderId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();
  const couponId = new mongoose.Types.ObjectId();

  const validInvoice = {
    invoiceNumber: "INV-000001",
    orderId,
    userId,
    courseId,
    subtotal: 1000,
    discountAmount: 100,
    couponId,
    taxableAmount: 900,
    cgst: 81,
    sgst: 81,
    igst: 0,
    totalTax: 162,
    totalAmount: 1062,
    status: INVOICE_STATUS.ISSUED,
  };

  it("should validate a completely valid invoice", async () => {
    const invoice = new Invoice(validInvoice);

    await expect(invoice.validate()).resolves.toBeUndefined();
  });

  it("should apply default values", () => {
    const invoice = new Invoice({
      ...validInvoice,
      discountAmount: undefined,
      cgst: undefined,
      sgst: undefined,
      igst: undefined,
      totalTax: undefined,
      status: undefined,
    });

    expect(invoice.discountAmount).toBe(0);
    expect(invoice.cgst).toBe(0);
    expect(invoice.sgst).toBe(0);
    expect(invoice.igst).toBe(0);
    expect(invoice.totalTax).toBe(0);
    expect(invoice.status).toBe(INVOICE_STATUS.ISSUED);
  });

  it("should require invoiceNumber", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      invoiceNumber: undefined,
    });

    await expect(invoice.validate()).rejects.toThrow(/invoiceNumber/i);
  });

  it("should require orderId", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      orderId: undefined,
    });

    await expect(invoice.validate()).rejects.toThrow(/orderId/i);
  });

  it("should require userId", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      userId: undefined,
    });

    await expect(invoice.validate()).rejects.toThrow(/userId/i);
  });

  it("should require courseId", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      courseId: undefined,
    });

    await expect(invoice.validate()).rejects.toThrow(/courseId/i);
  });

  it("should require subtotal", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      subtotal: undefined,
    });

    await expect(invoice.validate()).rejects.toThrow(/subtotal/i);
  });

  it("should require taxableAmount", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      taxableAmount: undefined,
    });

    await expect(invoice.validate()).rejects.toThrow(/taxableAmount/i);
  });

  it("should require totalAmount", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      totalAmount: undefined,
    });

    await expect(invoice.validate()).rejects.toThrow(/totalAmount/i);
  });

  it("should reject invalid invoice status", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      status: "INVALID",
    });

    await expect(invoice.validate()).rejects.toThrow(/status/i);
  });

  it("should reject negative subtotal", async () => {
    const invoice = new Invoice({
      ...validInvoice,
      subtotal: -100,
    });

    await expect(invoice.validate()).rejects.toThrow(/subtotal/i);
  });

  it("should correctly export invoice statuses", () => {
    expect(INVOICE_STATUS.DRAFT).toBe("DRAFT");
    expect(INVOICE_STATUS.ISSUED).toBe("ISSUED");
    expect(INVOICE_STATUS.CANCELLED).toBe("CANCELLED");
    expect(INVOICE_STATUS.REFUNDED).toBe("REFUNDED");
  });
});