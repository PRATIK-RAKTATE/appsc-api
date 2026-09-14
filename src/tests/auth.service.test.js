import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

vi.mock("../services/socket.service.js", () => ({
  notifySessionTerminated: vi.fn(),
}));

vi.mock("../models/user.model.js", () => ({
  User: {
    findOne: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../models/userSession.model.js", () => ({
  UserSession: {
    create: vi.fn(),
    find: vi.fn(),
    updateMany: vi.fn(),
  },
}));

import { User } from "../models/user.model.js";
import { UserSession } from "../models/userSession.model.js";
import { notifySessionTerminated } from "../services/socket.service.js";

import {
  createAuthTokens,
  refreshAccessToken,
} from "../services/auth.service.js";

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
  });

  it("should create a 15-minute access token and 7-day refresh token", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);
    UserSession.create.mockResolvedValue({});
    UserSession.updateMany.mockResolvedValue({});

    const result = await createAuthTokens("TEST@example.com");

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    const accessDecoded = jwt.verify(
      result.accessToken,
      process.env.JWT_ACCESS_SECRET
    );

    const refreshDecoded = jwt.verify(
      result.refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    expect(accessDecoded.userId).toBe("123456789");
    expect(accessDecoded.email).toBe("test@example.com");
    expect(accessDecoded.role).toBe("STUDENT");

    expect(refreshDecoded.userId).toBe("123456789");

    expect(accessDecoded.exp - accessDecoded.iat).toBe(900);
    expect(refreshDecoded.exp - refreshDecoded.iat).toBe(604800);
  });

  it("should store only the hashed refresh token", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);
    UserSession.create.mockResolvedValue({});
    UserSession.updateMany.mockResolvedValue({});

    const result = await createAuthTokens("test@example.com");

    const savedSession = UserSession.create.mock.calls[0][0];

    expect(savedSession.refreshTokenHash).toBeDefined();
    expect(savedSession.refreshTokenHash).not.toBe(result.refreshToken);

    const isHashValid = await bcrypt.compare(
      result.refreshToken,
      savedSession.refreshTokenHash
    );

    expect(isHashValid).toBe(true);
  });

  it("should revoke existing active sessions before creating a new one", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);
    UserSession.create.mockResolvedValue({});
    UserSession.updateMany.mockResolvedValue({});

    await createAuthTokens("test@example.com");

    expect(UserSession.updateMany).toHaveBeenCalledWith(
      {
        userId: user._id,
        revokedAt: null,
        expiresAt: { $gt: expect.any(Date) },
      },
      { revokedAt: expect.any(Date) }
    );
  });

  it("should notify session termination after creating a new session", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);
    UserSession.create.mockResolvedValue({});
    UserSession.updateMany.mockResolvedValue({});

    await createAuthTokens("test@example.com");

    expect(notifySessionTerminated).toHaveBeenCalledWith(
      user._id.toString()
    );
  });

  it("should refresh the access token using a valid refresh token", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);

    UserSession.create.mockResolvedValue({});

    const tokens = await createAuthTokens("test@example.com");

    const session = UserSession.create.mock.calls[0][0];

    UserSession.find.mockResolvedValue([
      {
        _id: "session-1",
        userId: user._id,
        refreshTokenHash: session.refreshTokenHash,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ]);

    User.findById.mockResolvedValue(user);

    const accessToken = await refreshAccessToken(tokens.refreshToken);

    expect(accessToken).toBeDefined();

    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET
    );

    expect(decoded.userId).toBe("123456789");
    expect(decoded.email).toBe("test@example.com");
    expect(decoded.role).toBe("STUDENT");

    expect(decoded.exp - decoded.iat).toBe(900);
  });

  it("should reject refresh token when the session has been revoked", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);
    UserSession.create.mockResolvedValue({});
    UserSession.updateMany.mockResolvedValue({});

    const tokens = await createAuthTokens("test@example.com");

    UserSession.find.mockResolvedValue([]);

    User.findById.mockResolvedValue(user);

    await expect(
      refreshAccessToken(tokens.refreshToken)
    ).rejects.toThrow("Invalid or expired refresh token");
  });
});
