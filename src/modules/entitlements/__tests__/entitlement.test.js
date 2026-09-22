import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Course } from "../../courses/index.js";
import { UserEntitlement, ENTITLEMENT_STATUS } from "../models/userEntitlement.model.js";
import { activateCourseEntitlement } from "../services/entitlement.service.js";
import { expireEntitlements } from "../jobs/expiryCron.js";

vi.mock("../../courses/index.js");
vi.mock("../models/userEntitlement.model.js", async () => {
  const actual = await vi.importActual("../models/userEntitlement.model.js");
  return {
    ...actual,
    UserEntitlement: {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  };
});

describe("Entitlement Service", () => {
  const userId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();
  const orderId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should activate a new entitlement with correct expiresAt", async () => {
    Course.findById.mockResolvedValue({
      _id: courseId,
      validityInDays: 30,
    });
    UserEntitlement.findOne.mockResolvedValue(null);
    UserEntitlement.create.mockImplementation((data) => Promise.resolve(data));

    const result = await activateCourseEntitlement(userId, courseId, orderId);

    expect(UserEntitlement.create).toHaveBeenCalled();
    const createdData = UserEntitlement.create.mock.calls[0][0];
    
    const expectedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const diff = Math.abs(result.expiresAt.getTime() - expectedExpiresAt.getTime());
    expect(diff).toBeLessThan(1000); // within 1 second
  });

  it("should extend validity if an active entitlement already exists", async () => {
    const currentExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    Course.findById.mockResolvedValue({
      _id: courseId,
      validityInDays: 30,
    });
    UserEntitlement.findOne.mockResolvedValue({
      userId,
      courseId,
      expiresAt: currentExpiry,
      isLifetime: false,
    });
    UserEntitlement.findOneAndUpdate.mockImplementation((filter, update) => Promise.resolve(update.$set));

    await activateCourseEntitlement(userId, courseId, orderId);

    expect(UserEntitlement.findOneAndUpdate).toHaveBeenCalled();
    const update = UserEntitlement.findOneAndUpdate.mock.calls[0][1];
    const newExpiresAt = update.$set.expiresAt;
    
    const expectedExpiresAt = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    const diff = Math.abs(newExpiresAt.getTime() - expectedExpiresAt.getTime());
    expect(diff).toBeLessThan(1000);
  });

  it("should extend from now if existing entitlement has already expired", async () => {
    const pastExpiry = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    Course.findById.mockResolvedValue({
      _id: courseId,
      validityInDays: 30,
    });
    UserEntitlement.findOne.mockResolvedValue({
      userId,
      courseId,
      expiresAt: pastExpiry,
      isLifetime: false,
    });
    UserEntitlement.findOneAndUpdate.mockImplementation((filter, update) => Promise.resolve(update.$set));

    await activateCourseEntitlement(userId, courseId, orderId);

    expect(UserEntitlement.findOneAndUpdate).toHaveBeenCalled();
    const update = UserEntitlement.findOneAndUpdate.mock.calls[0][1];
    const newExpiresAt = update.$set.expiresAt;
    
    const expectedExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const diff = Math.abs(newExpiresAt.getTime() - expectedExpiresAt.getTime());
    expect(diff).toBeLessThan(1000);
  });
});

describe("Expiry Cron Job", () => {
  it("should transition active expired records to EXPIRED status", async () => {
    UserEntitlement.updateMany.mockResolvedValue({ modifiedCount: 5 });

    const count = await expireEntitlements();

    expect(UserEntitlement.updateMany).toHaveBeenCalledWith(
      { 
        status: ENTITLEMENT_STATUS.ACTIVE, 
        isLifetime: false, 
        expiresAt: { $lt: expect.any(Date) } 
      }, 
      { 
        $set: { status: ENTITLEMENT_STATUS.EXPIRED } 
      }
    );
    expect(count).toBe(5);
  });
});
