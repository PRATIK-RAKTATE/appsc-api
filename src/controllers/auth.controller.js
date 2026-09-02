import { createOTP, verifyOTP } from "../services/otp.service.js";
import { sendOTPEmail } from "../services/email.service.js";
import { checkOTPRateLimit } from "../services/otpRateLimit.service.js";
import { createAuthTokens , refreshAccessToken } from "../services/auth.service.js";
import { User } from "../models/user.model.js";

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Get client IP
    const ip = req.ip;

    console.log("OTP request:", {
      email,
      ip,
    });

    // Check OTP rate limit
    const rateLimit = await checkOTPRateLimit(email, ip);

    console.log("Rate limit result:", rateLimit);

    if (!rateLimit.allowed) {
      return res.status(rateLimit.statusCode).json({
        success: false,
        message: rateLimit.message,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    // Generate OTP
    const otp = await createOTP(email);

    // Send OTP email
    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

export const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    await verifyOTP(email, otp);

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    let user = await User.findOne({
      email: normalizedEmail,
    });

    // Create user if this is their first login
    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        isVerified: true,
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const tokens = await createAuthTokens(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const accessToken = await refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};