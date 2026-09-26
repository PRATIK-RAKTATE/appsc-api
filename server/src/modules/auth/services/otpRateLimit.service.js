import { OTPRateLimit } from "../models/otpRateLimit.model.js";

const MAX_REQUESTS = 3;
const WINDOW_MS = 15 * 60 * 1000;
const MIN_GAP_MS = 60 * 1000;

export const checkOTPRateLimit = async (email, ip) => {
  const normalizedEmail = email.toLowerCase().trim();

  let rateLimit = await OTPRateLimit.findOne({
    email: normalizedEmail,
    ip,
  });

  const now = Date.now();

  // First OTP request
  if (!rateLimit) {
    rateLimit = await OTPRateLimit.create({
      email: normalizedEmail,
      ip,
      requestCount: 1,
      windowStartedAt: new Date(now),
      lastRequestedAt: new Date(now),
    });

    return {
      allowed: true,
    };
  }

  const windowAge = now - rateLimit.windowStartedAt.getTime();

  // 15-minute window has expired
  if (windowAge >= WINDOW_MS) {
    rateLimit.requestCount = 1;
    rateLimit.windowStartedAt = new Date(now);
    rateLimit.lastRequestedAt = new Date(now);

    await rateLimit.save();

    return {
      allowed: true,
    };
  }

  // Check 60-second gap
  const timeSinceLastRequest =
    now - rateLimit.lastRequestedAt.getTime();

  if (timeSinceLastRequest < MIN_GAP_MS) {
    const retryAfterSeconds = Math.ceil(
      (MIN_GAP_MS - timeSinceLastRequest) / 1000
    );

    return {
      allowed: false,
      statusCode: 429,
      message: `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
      retryAfterSeconds,
    };
  }

  // Check maximum 3 requests
  if (rateLimit.requestCount >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil(
      (WINDOW_MS - windowAge) / 1000
    );

    return {
      allowed: false,
      statusCode: 429,
      message:
        "Maximum OTP requests reached. Please try again later.",
      retryAfterSeconds,
    };
  }

  // Valid request
  rateLimit.requestCount += 1;
  rateLimit.lastRequestedAt = new Date(now);

  await rateLimit.save();

  return {
    allowed: true,
  };
};