import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import AuditLog from "../models/auditLog.model.js";

describe("AuditLog Model", () => {
  it("should create a valid audit log", async () => {
    const actorId = new mongoose.Types.ObjectId();
    const resourceId = new mongoose.Types.ObjectId();

    const auditLog = new AuditLog({
      actorId,
      action: "UPDATE_USER",
      resourceType: "USER",
      resourceId,
      changes: {
        role: {
          from: "USER",
          to: "ADMIN",
        },
      },
    });

    await expect(auditLog.validate()).resolves.not.toThrow();

    expect(auditLog.actorId.toString()).toBe(actorId.toString());
    expect(auditLog.action).toBe("UPDATE_USER");
    expect(auditLog.resourceType).toBe("USER");
    expect(auditLog.resourceId.toString()).toBe(resourceId.toString());
    expect(auditLog.changes.role.from).toBe("USER");
    expect(auditLog.changes.role.to).toBe("ADMIN");
  });

  it("should require actorId", async () => {
    const auditLog = new AuditLog({
      action: "UPDATE_USER",
      resourceType: "USER",
    });

    await expect(auditLog.validate()).rejects.toThrow(/actorId/);
  });

  it("should require action", async () => {
    const auditLog = new AuditLog({
      actorId: new mongoose.Types.ObjectId(),
      resourceType: "USER",
    });

    await expect(auditLog.validate()).rejects.toThrow(/action/);
  });

  it("should require resourceType", async () => {
    const auditLog = new AuditLog({
      actorId: new mongoose.Types.ObjectId(),
      action: "UPDATE_USER",
    });

    await expect(auditLog.validate()).rejects.toThrow(/resourceType/);
  });

  it("should convert action to uppercase", async () => {
    const auditLog = new AuditLog({
      actorId: new mongoose.Types.ObjectId(),
      action: "update_user",
      resourceType: "USER",
    });

    await auditLog.validate();

    expect(auditLog.action).toBe("UPDATE_USER");
  });

  it("should allow resourceId to be omitted", async () => {
    const auditLog = new AuditLog({
      actorId: new mongoose.Types.ObjectId(),
      action: "LOGIN",
      resourceType: "ADMIN",
    });

    await expect(auditLog.validate()).resolves.not.toThrow();
  });

  it("should default changes to an empty object", async () => {
    const auditLog = new AuditLog({
      actorId: new mongoose.Types.ObjectId(),
      action: "LOGIN",
      resourceType: "ADMIN",
    });

    await auditLog.validate();

    expect(auditLog.changes).toEqual({});
  });

  it("should define timestamp fields", () => {
    expect(AuditLog.schema.path("createdAt")).toBeDefined();
    expect(AuditLog.schema.path("updatedAt")).toBeDefined();
  });

  it("should have the expected indexes", () => {
    const indexes = AuditLog.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ actorId: 1, createdAt: -1 }, expect.any(Object)],
        [
          { resourceType: 1, resourceId: 1, createdAt: -1 },
          expect.any(Object),
        ],
      ])
    );
  });

  it("should use AuditLog as the model name", () => {
    expect(AuditLog.modelName).toBe("AuditLog");
  });
});