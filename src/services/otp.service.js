import bcrypt from "bcryptjs";
import { OTP } from "../models/otp.model.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

export const generateOTP = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;

  return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

export const createOTP = async (email) => {
  const otp = generateOTP();

  const otpHash = await bcrypt.hash(otp, 10);

  const expiresAt = new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );

  await OTP.create({
    email: email.toLowerCase().trim(),
    otpHash,
    expiresAt,
  });

  return otp;
};

export const verifyOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({
    email: email.toLowerCase().trim(),
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    throw new Error("OTP not found or expired");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new Error("OTP expired");
  }

  const isValid = await bcrypt.compare(
    otp,
    otpRecord.otpHash
  );

  if (!isValid) {
    throw new Error("Invalid OTP");
  }

  await OTP.deleteOne({
    _id: otpRecord._id,
  });

  return true;
};