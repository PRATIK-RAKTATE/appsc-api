import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

vi.mock("../services/socket.service.js", () => ({
  emitSessionRevoked: vi.fn(),
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
import { emitSessionRevoked } from "../services/socket.service.js";

import {
  createAuthTokens,
  refreshAccessToken,
} from "../services/auth.service.js";

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_ACCESS_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

    // Default: no active sessions to revoke
    UserSession.find.mockResolvedValue([]);
    UserSession.updateMany.mockResolvedValue({});
    UserSession.create.mockResolvedValue({ _id: "new-session-id" });
  });

  it("should create a 15-minute access token and 7-day refresh token", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);

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

  it("should embed the new session id (sid) in the access token", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);
    UserSession.create.mockResolvedValue({ _id: "new-session-id" });

    const result = await createAuthTokens("test@example.com");

    const decoded = jwt.verify(
      result.accessToken,
      process.env.JWT_ACCESS_SECRET
    );

    expect(decoded.sid).toBe("new-session-id");
  });

  it("should store only the hashed refresh token", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);

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

  it("should emit session_revoked only to the revoked sessions (TASK-01.3.2)", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);

    // Two pre-existing active sessions (Device A's sessions)
    UserSession.find.mockResolvedValue([
      { _id: { toString: () => "old-session-1" } },
      { _id: { toString: () => "old-session-2" } },
    ]);

    UserSession.create.mockResolvedValue({ _id: "new-session-id" });

    await createAuthTokens("test@example.com");

    expect(emitSessionRevoked).toHaveBeenCalledWith([
      "old-session-1",
      "old-session-2",
    ]);
  });

  it("should call emitSessionRevoked with an empty array when no prior sessions exist", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);
    UserSession.find.mockResolvedValue([]);

    await createAuthTokens("test@example.com");

    expect(emitSessionRevoked).toHaveBeenCalledWith([]);
  });

  it("should refresh the access token using a valid refresh token", async () => {
    const user = {
      _id: "123456789",
      email: "test@example.com",
      role: "STUDENT",
    };

    User.findOne.mockResolvedValue(user);

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

    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

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

    const tokens = await createAuthTokens("test@example.com");

    UserSession.find.mockResolvedValue([]);

    User.findById.mockResolvedValue(user);

    await expect(
      refreshAccessToken(tokens.refreshToken)
    ).rejects.toThrow("Invalid or expired refresh token");
  });
});
