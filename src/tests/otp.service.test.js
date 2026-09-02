import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
const { sendMailMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
}));


vi.mock("../models/otp.model.js", () => ({
  OTP: {
    create: vi.fn(),
    findOne: vi.fn(),
    deleteOne: vi.fn(),
  },
}));



vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: sendMailMock,
    })),
  },
}));

import { OTP } from "../models/otp.model.js";
import {
  generateOTP,
  createOTP,
  verifyOTP,
} from "../services/otp.service.js";

import { sendOTPEmail } from "../services/email.service.js";

import nodemailer from "nodemailer";

describe("OTP Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a 6-digit numeric OTP", () => {
    const otp = generateOTP();

    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("should create OTP with 10-minute expiry", async () => {
    OTP.create.mockResolvedValue({});

    const before = Date.now();

    await createOTP("test@example.com");

    const after = Date.now();

    const savedOTP = OTP.create.mock.calls[0][0];

    const expiryTime = savedOTP.expiresAt.getTime();

    const expectedMin = before + 10 * 60 * 1000;
    const expectedMax = after + 10 * 60 * 1000;

    expect(expiryTime).toBeGreaterThanOrEqual(expectedMin);
    expect(expiryTime).toBeLessThanOrEqual(expectedMax);
  });

  it("should hash the OTP before saving", async () => {
    OTP.create.mockResolvedValue({});

    const otp = await createOTP("test@example.com");

    const savedOTP = OTP.create.mock.calls.at(-1)[0];

    expect(savedOTP.otpHash).toBeDefined();
    expect(savedOTP.otpHash).not.toBe(otp);
  });

  it("should verify a correct OTP", async () => {
    const otp = "123456";
    const otpHash = await bcrypt.hash(otp, 10);

    OTP.findOne.mockReturnValue({
      sort: vi.fn().mockResolvedValue({
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        _id: "test-id",
      }),
    });

    OTP.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const result = await verifyOTP("test@example.com", otp);

    expect(result).toBe(true);

    expect(OTP.deleteOne).toHaveBeenCalledWith({
      _id: "test-id",
    });
  });

  it("should reject an invalid OTP", async () => {
    const otpHash = await bcrypt.hash("123456", 10);

    OTP.findOne.mockReturnValue({
      sort: vi.fn().mockResolvedValue({
        otpHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        _id: "test-id",
      }),
    });

    await expect(
      verifyOTP("test@example.com", "999999")
    ).rejects.toThrow("Invalid OTP");

    expect(OTP.deleteOne).not.toHaveBeenCalled();
  });

  it("should reject an expired OTP", async () => {
    OTP.findOne.mockReturnValue({
      sort: vi.fn().mockResolvedValue({
        otpHash: "some-hash",
        expiresAt: new Date(Date.now() - 1000),
        _id: "test-id",
      }),
    });

    await expect(
      verifyOTP("test@example.com", "123456")
    ).rejects.toThrow("OTP expired");

    expect(OTP.deleteOne).not.toHaveBeenCalled();
  });

  it("should reject when OTP is not found", async () => {
    OTP.findOne.mockReturnValue({
      sort: vi.fn().mockResolvedValue(null),
    });

    await expect(
      verifyOTP("test@example.com", "123456")
    ).rejects.toThrow("OTP not found or expired");
  });
});

describe("Email Service", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
  });

  it("should send OTP email with correct data", async () => {
    sendMailMock.mockResolvedValue({
      messageId: "test-message-id",
    });

    await sendOTPEmail("test@example.com", "123456");

    expect(sendMailMock).toHaveBeenCalledWith({
      from: `"Your App" <${process.env.SMTP_USER}>`,
      to: "test@example.com",
      subject: "Your OTP",
      text: "Your OTP is 123456. It is valid for 10 minutes.",
    });
  });

  it("should throw an error when email sending fails", async () => {
    sendMailMock.mockRejectedValue(
      new Error("SMTP connection failed")
    );

    await expect(
      sendOTPEmail("test@example.com", "123456")
    ).rejects.toThrow("SMTP connection failed");
  });
});