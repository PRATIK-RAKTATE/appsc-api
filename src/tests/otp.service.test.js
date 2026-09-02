import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcryptjs";

import { OTP } from "../models/otp.model.js";
import { generateOTP, verifyOTP } from "../services/otp.service.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await OTP.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("OTP Service", () => {
  it("should generate a 6-digit numeric OTP", () => {
    const otp = generateOTP();

    expect(otp).toHaveLength(6);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("should verify a correct OTP", async () => {
    const email = "test@example.com";
    const otp = "123456";

    const otpHash = await bcrypt.hash(otp, 10);

    await OTP.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const result = await verifyOTP(email, otp);

    expect(result).toBe(true);

    const otpRecord = await OTP.findOne({ email });

    expect(otpRecord).toBeNull();
  });
});