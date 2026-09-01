import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { UserSession } from "../models/userSession.model.js";


const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export const createAuthTokens = async (email) => { 
  const normalizedEmail = email.toLowerCase().trim();

  // Find the user
  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Access token
  const accessToken = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }
  );

  // Refresh token
  const refreshToken = jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }
  );

  // Store only the hash of the refresh token
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRES_MS
  );

  await UserSession.create({
    userId: user._id,
    refreshTokenHash,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const sessions = await UserSession.find({
      userId: decoded.userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    let validSession = null;

    for (const session of sessions) {
      const isValid = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash
      );

      if (isValid) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new Error("Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return accessToken;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};