import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

import {
  verifyToken,
  requireRole,
} from "../middleware/auth.middleware.js";

const { userFindByIdMock } = vi.hoisted(() => ({
  userFindByIdMock: vi.fn(),
}));

vi.mock("../../users/index.js", () => ({
  User: {
    findById: userFindByIdMock,
  },
}));

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_ACCESS_SECRET = "test-access-secret";
  });

  describe("verifyToken", () => {
    it("should allow request with a valid access token", async () => {
      const token = jwt.sign(
        {
          userId: "123456789",
          email: "test@example.com",
          role: "STUDENT",
          tokenVersion: 0,
        },
        process.env.JWT_ACCESS_SECRET,
        {
          expiresIn: "15m",
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      userFindByIdMock.mockResolvedValue({
        _id: "123456789",
        email: "test@example.com",
        role: "STUDENT",
        status: "ACTIVE",
        tokenVersion: 0,
        toObject: () => ({ email: "test@example.com", role: "STUDENT", status: "ACTIVE" }),
      });

      await verifyToken(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.user.userId).toBe("123456789");
      expect(req.user.email).toBe("test@example.com");
      expect(req.user.role).toBe("STUDENT");
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject request when access token is missing", async () => {
      const req = {
        headers: {},
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Access token is required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject request with an invalid access token", async () => {
      const req = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid or expired access token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject request with an expired access token", async () => {
      const token = jwt.sign(
        {
          userId: "123456789",
          email: "test@example.com",
          role: "STUDENT",
        },
        process.env.JWT_ACCESS_SECRET,
        {
          expiresIn: -1,
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Invalid or expired access token",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should allow request when user has the required role", () => {
      const req = {
        user: {
          userId: "123456789",
          email: "admin@example.com",
          role: "ADMIN",
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      requireRole("ADMIN")(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should allow multiple roles", () => {
      const req = {
        user: {
          userId: "123456789",
          email: "mentor@example.com",
          role: "MENTOR",
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      requireRole("ADMIN", "MENTOR")(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject user with an unauthorized role", () => {
      const req = {
        user: {
          userId: "123456789",
          email: "student@example.com",
          role: "STUDENT",
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      requireRole("ADMIN")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: "You do not have permission to access this resource",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject request when authentication is missing", () => {
      const req = {};

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      const next = vi.fn();

      requireRole("ADMIN")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Authentication required",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
