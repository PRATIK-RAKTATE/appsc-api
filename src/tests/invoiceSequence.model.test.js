import { describe, it, expect } from "vitest";
import { InvoiceSequence } from "../models/invoiceSequence.model.js";

describe("InvoiceSequence Model", () => {
  const validSequence = {
    key: "2026",
    prefix: "INV",
    currentNumber: 0,
  };

  it("should validate a completely valid invoice sequence", async () => {
    const sequence = new InvoiceSequence(validSequence);

    await expect(sequence.validate()).resolves.toBeUndefined();
  });

  it("should apply default values", () => {
    const sequence = new InvoiceSequence({
      key: "2026",
    });

    expect(sequence.prefix).toBe("INV");
    expect(sequence.currentNumber).toBe(0);
  });

  it("should require key", async () => {
    const sequence = new InvoiceSequence({
      prefix: "INV",
      currentNumber: 0,
    });

    await expect(sequence.validate()).rejects.toThrow(/key/i);
  });

  it("should apply default prefix", () => {
    const sequence = new InvoiceSequence({
      key: "2026",
      currentNumber: 0,
    });

    expect(sequence.prefix).toBe("INV");
  });

  it("should reject negative currentNumber", async () => {
    const sequence = new InvoiceSequence({
      ...validSequence,
      currentNumber: -1,
    });

    await expect(sequence.validate()).rejects.toThrow(/currentNumber/i);
  });

  it("should convert prefix to uppercase", () => {
    const sequence = new InvoiceSequence({
      ...validSequence,
      prefix: "inv",
    });

    expect(sequence.prefix).toBe("INV");
  });
});