import { describe, it, expect, vi, beforeEach } from "vitest";

const { verifyOTPMock, createAuthTokensMock, userFindOneMock, userCreateMock } =
  vi.hoisted(() => ({
    verifyOTPMock: vi.fn(),
    createAuthTokensMock: vi.fn(),
    userFindOneMock: vi.fn(),
    userCreateMock: vi.fn(),
  }));

vi.mock("../services/otp.service.js", () => ({
  createOTP: vi.fn(),
  verifyOTP: verifyOTPMock,
}));

vi.mock("../services/auth.service.js", () => ({
  createAuthTokens: createAuthTokensMock,
  refreshAccessToken: vi.fn(),
}));

vi.mock("../models/user.model.js", () => ({
  User: {
    findOne: userFindOneMock,
    create: userCreateMock,
  },
}));

import { verifyOTPController } from "../controllers/auth.controller.js";

describe("Verify OTP Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify OTP, mark user as verified, and issue tokens", async () => {
    const user = {
      _id: "user-id",
      email: "test@example.com",
      name: "test",
      role: "STUDENT",
      isVerified: false,
      save: vi.fn(),
    };

    userFindOneMock.mockResolvedValue(user);

    verifyOTPMock.mockResolvedValue(true);

    createAuthTokensMock.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const req = {
      body: {
        email: "test@example.com",
        otp: "123456",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await verifyOTPController(req, res);

    expect(verifyOTPMock).toHaveBeenCalledWith(
      "test@example.com",
      "123456"
    );

    expect(user.isVerified).toBe(true);
    expect(user.save).toHaveBeenCalled();

    expect(createAuthTokensMock).toHaveBeenCalledWith(
      "test@example.com"
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "OTP verified successfully",
      data: {
        user: {
          id: "user-id",
          email: "test@example.com",
          name: "test",
          role: "STUDENT",
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });
  });

  it("should create a new verified user on first login", async () => {
    userFindOneMock.mockResolvedValue(null);

    userCreateMock.mockResolvedValue({
      _id: "new-user-id",
      email: "test@example.com",
      name: "test",
      role: "STUDENT",
      isVerified: true,
    });

    verifyOTPMock.mockResolvedValue(true);

    createAuthTokensMock.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const req = {
      body: {
        email: "test@example.com",
        otp: "123456",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await verifyOTPController(req, res);

    expect(userCreateMock).toHaveBeenCalledWith({
      email: "test@example.com",
      name: "test",
      isVerified: true,
    });

    expect(createAuthTokensMock).toHaveBeenCalledWith(
      "test@example.com"
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should reject request when email or OTP is missing", async () => {
    const req = {
      body: {
        email: "test@example.com",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await verifyOTPController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Email and OTP are required",
    });

    expect(verifyOTPMock).not.toHaveBeenCalled();
    expect(createAuthTokensMock).not.toHaveBeenCalled();
  });

  it("should not issue tokens when OTP verification fails", async () => {
    verifyOTPMock.mockRejectedValue(new Error("Invalid OTP"));

    const req = {
      body: {
        email: "test@example.com",
        otp: "999999",
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await verifyOTPController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid OTP",
    });

    expect(createAuthTokensMock).not.toHaveBeenCalled();
  });
});