import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../../users/index.js";
import { UserSession } from "../models/userSession.model.js";
import { emitSessionRevoked } from "../../chat/index.js";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export const createAuthTokens = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Collect the IDs of all sessions that are about to be revoked so we can
  // target exactly those sockets with session_revoked – never the new device.
  const activeSessions = await UserSession.find({
    userId: user._id,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  const revokedSessionIds = activeSessions.map((s) => s._id.toString());

  await UserSession.updateMany(
    {
      userId: user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { revokedAt: new Date() }
  );

  const refreshToken = jwt.sign(
    {
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

  const newSession = await UserSession.create({
    userId: user._id,
    refreshTokenHash,
    expiresAt,
  });

  const accessToken = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      // `sid` lets socket.service associate sockets with exactly this session.
      sid: newSession._id.toString(),
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  // Notify only the previously-active sessions' sockets — not the new device.
  emitSessionRevoked(revokedSessionIds);

  return {
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

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
        sid: validSession._id.toString(),
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    return accessToken;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};