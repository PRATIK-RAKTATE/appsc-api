import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  UserEntitlement,
  ENTITLEMENT_STATUS,
} from "../models/userEntitlement.model.js";

describe("UserEntitlement Model", () => {
  const userId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();

  const validEntitlement = {
    userId,
    courseId,
    orderId,
    startsAt: new Date(Date.now() - 10000), // started 10 seconds ago
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // expires in 30 days
    status: ENTITLEMENT_STATUS.ACTIVE,
  };

  it("should validate a completely valid user entitlement", async () => {
    const entitlement = new UserEntitlement(validEntitlement);
    await expect(entitlement.validate()).resolves.toBeUndefined();
  });

  it("should apply default values for startsAt and status", () => {
    const entitlement = new UserEntitlement({
      userId,
      courseId,
      orderId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    expect(entitlement.status).toBe(ENTITLEMENT_STATUS.ACTIVE);
    expect(entitlement.startsAt).toBeDefined();
    expect(entitlement.startsAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("should require userId", async () => {
    const entitlement = new UserEntitlement({
      ...validEntitlement,
      userId: undefined,
    });

    await expect(entitlement.validate()).rejects.toThrow(/userId/i);
  });

  it("should require courseId", async () => {
    const entitlement = new UserEntitlement({
      ...validEntitlement,
      courseId: undefined,
    });

    await expect(entitlement.validate()).rejects.toThrow(/courseId/i);
  });

  it("should require orderId", async () => {
    const entitlement = new UserEntitlement({
      ...validEntitlement,
      orderId: undefined,
    });

    await expect(entitlement.validate()).rejects.toThrow(/orderId/i);
  });

  it("should require expiresAt", async () => {
    const entitlement = new UserEntitlement({
      ...validEntitlement,
      expiresAt: undefined,
    });

    await expect(entitlement.validate()).rejects.toThrow(/expiresAt/i);
  });

  it("should reject invalid status", async () => {
    const entitlement = new UserEntitlement({
      ...validEntitlement,
      status: "INVALID_STATUS",
    });

    await expect(entitlement.validate()).rejects.toThrow(/status/i);
  });

  it("should correctly evaluate isAccessValid() method", () => {
    // Active and within timeframe
    const validAccess = new UserEntitlement(validEntitlement);
    expect(validAccess.isAccessValid()).toBe(true);

    // Active but expired date
    const expiredDateAccess = new UserEntitlement({
      ...validEntitlement,
      expiresAt: new Date(Date.now() - 10000), // expired 10 seconds ago
    });
    expect(expiredDateAccess.isAccessValid()).toBe(false);

    // Future start date
    const futureAccess = new UserEntitlement({
      ...validEntitlement,
      startsAt: new Date(Date.now() + 10000), // starts in 10 seconds
    });
    expect(futureAccess.isAccessValid()).toBe(false);

    // Status is not active
    const revokedAccess = new UserEntitlement({
      ...validEntitlement,
      status: ENTITLEMENT_STATUS.REVOKED,
    });
    expect(revokedAccess.isAccessValid()).toBe(false);
  });

  it("should transition status to EXPIRED using markExpired()", () => {
    const entitlement = new UserEntitlement(validEntitlement);
    entitlement.markExpired();
    expect(entitlement.status).toBe(ENTITLEMENT_STATUS.EXPIRED);
  });

  it("should correctly export constants", () => {
    expect(ENTITLEMENT_STATUS.ACTIVE).toBe("ACTIVE");
    expect(ENTITLEMENT_STATUS.EXPIRED).toBe("EXPIRED");
    expect(ENTITLEMENT_STATUS.REVOKED).toBe("REVOKED");
  });
});
