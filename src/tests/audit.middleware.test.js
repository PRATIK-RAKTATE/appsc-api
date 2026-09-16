import { describe, expect, it, vi, beforeEach } from "vitest";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("../models/auditLog.model.js", () => ({
  default: {
    create: createMock,
  },
}));

import { auditLog } from "../middleware/audit.middleware.js";

describe("Audit Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRes = () => {
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    const res = {
      status: statusMock,
      json: jsonMock,
      statusCode: 200,
    };

    return { res, jsonMock, statusMock };
  };

  const baseReq = {
    method: "POST",
    user: { userId: "507f1f77bcf86cd799439011", role: "ADMIN" },
    body: { title: "New Book" },
    params: {},
    baseUrl: "/api/books",
    path: "/api/books",
  };

  it("should create audit log for successful POST request", async () => {
    createMock.mockResolvedValue({ _id: "log1" });

    const req = {
      ...baseReq,
      method: "POST",
      body: { title: "New Book" },
    };

    const { res, jsonMock } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "CREATE_BOOK" });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();

    res.status(201);
    res.json({ success: true, data: { _id: "book1", title: "New Book" } });

    expect(createMock).toHaveBeenCalledWith({
      actorId: "507f1f77bcf86cd799439011",
      action: "CREATE_BOOK",
      resourceType: "BOOK",
      changes: {
        input: { title: "New Book" },
        output: { _id: "book1", title: "New Book" },
      },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: { _id: "book1", title: "New Book" },
    });
  });

  it("should create audit log for successful PATCH request", async () => {
    createMock.mockResolvedValue({ _id: "log2" });

    const req = {
      ...baseReq,
      method: "PATCH",
      body: { title: "Updated Title" },
      params: { id: "507f1f77bcf86cd799439012" },
    };

    const { res, jsonMock } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "UPDATE_BOOK" });
    await middleware(req, res, next);

    res.status(200);
    res.json({ success: true, data: { _id: "507f1f77bcf86cd799439012", title: "Updated Title" } });

    expect(createMock).toHaveBeenCalledWith({
      actorId: "507f1f77bcf86cd799439011",
      action: "UPDATE_BOOK",
      resourceType: "BOOK",
      resourceId: "507f1f77bcf86cd799439012",
      changes: {
        input: { title: "Updated Title" },
        output: { _id: "507f1f77bcf86cd799439012", title: "Updated Title" },
      },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: { _id: "507f1f77bcf86cd799439012", title: "Updated Title" },
    });
  });

  it("should create audit log for successful DELETE request", async () => {
    createMock.mockResolvedValue({ _id: "log3" });

    const req = {
      ...baseReq,
      method: "DELETE",
      body: {},
      params: { id: "507f1f77bcf86cd799439013" },
    };

    const { res, jsonMock } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "DELETE_BOOK" });
    await middleware(req, res, next);

    res.status(200);
    res.json({ success: true, message: "Book deleted successfully" });

    expect(createMock).toHaveBeenCalledWith({
      actorId: "507f1f77bcf86cd799439011",
      action: "DELETE_BOOK",
      resourceType: "BOOK",
      resourceId: "507f1f77bcf86cd799439013",
      changes: {
        deleted: { id: "507f1f77bcf86cd799439013" },
      },
    });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "Book deleted successfully",
    });
  });

  it("should capture actor from req.user._id when userId is absent", async () => {
    createMock.mockResolvedValue({ _id: "log4" });

    const req = {
      ...baseReq,
      user: { _id: "507f1f77bcf86cd799439014", role: "ADMIN" },
    };

    const { res } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "CREATE_BOOK" });
    await middleware(req, res, next);

    res.status(201);
    res.json({ success: true, data: { _id: "book2" } });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "507f1f77bcf86cd799439014",
      })
    );
  });

  it("should skip audit log when user is missing", async () => {
    const req = {
      method: "POST",
      body: { title: "New Book" },
      params: {},
    };

    const { res } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "CREATE_BOOK" });
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("should not create audit log for error responses", async () => {
    createMock.mockResolvedValue({ _id: "log5" });

    const req = baseReq;
    const { res } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "CREATE_BOOK" });
    await middleware(req, res, next);

    res.status(400);
    res.json({ success: false, message: "Bad request" });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("should not create audit log for 500 responses", async () => {
    createMock.mockResolvedValue({ _id: "log6" });

    const req = baseReq;
    const { res } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "CREATE_BOOK" });
    await middleware(req, res, next);

    res.status(500);
    res.json({ success: false, message: "Server error" });

    expect(createMock).not.toHaveBeenCalled();
  });

  it("should not break response if AuditLog.create fails", async () => {
    createMock.mockRejectedValue(new Error("Database connection failed"));

    const req = baseReq;
    const { res, jsonMock } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "CREATE_BOOK" });
    await middleware(req, res, next);

    res.status(201);
    res.json({ success: true, data: { _id: "book3" } });

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: { _id: "book3" },
    });
  });

  it("should default action to METHOD_RESOURCE_TYPE when action is not provided", async () => {
    createMock.mockResolvedValue({ _id: "log7" });

    const req = {
      ...baseReq,
      method: "POST",
    };

    const { res } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK" });
    await middleware(req, res, next);

    res.status(201);
    res.json({ success: true, data: { _id: "book4" } });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "POST_BOOK",
      })
    );
  });

  it("should use custom captureChanges function when provided", async () => {
    createMock.mockResolvedValue({ _id: "log8" });

    const req = {
      ...baseReq,
      method: "PATCH",
      body: { title: "Updated" },
      params: { id: "507f1f77bcf86cd799439015" },
    };

    const { res } = createRes();
    const next = vi.fn();

    const customCapture = () => ({
      field: "title",
      from: "Old Title",
      to: "Updated",
    });

    const middleware = auditLog({
      resourceType: "BOOK",
      action: "UPDATE_BOOK",
      captureChanges: customCapture,
    });
    await middleware(req, res, next);

    res.status(200);
    res.json({ success: true, data: { _id: "507f1f77bcf86cd799439015" } });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: {
          field: "title",
          from: "Old Title",
          to: "Updated",
        },
      })
    );
  });

  it("should extract resourceId from params when available", async () => {
    createMock.mockResolvedValue({ _id: "log9" });

    const req = {
      ...baseReq,
      method: "PUT",
      params: { id: "507f1f77bcf86cd799439016" },
    };

    const { res } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "UPDATE_BOOK" });
    await middleware(req, res, next);

    res.status(200);
    res.json({ success: true, data: { _id: "507f1f77bcf86cd799439016" } });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceId: "507f1f77bcf86cd799439016",
      })
    );
  });

  it("should not include resourceId when no valid ObjectId is found", async () => {
    createMock.mockResolvedValue({ _id: "log10" });

    const req = {
      ...baseReq,
      method: "PATCH",
      params: { key: "maintenance_mode" },
      body: { value: true },
    };

    const { res } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "PLATFORM_SETTING", action: "UPDATE_PLATFORM_SETTING" });
    await middleware(req, res, next);

    res.status(200);
    res.json({ success: true, data: { key: "maintenance_mode", value: true } });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: "PLATFORM_SETTING",
      })
    );

    const callArgs = createMock.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty("resourceId");
  });

  it("should skip audit log when actorId is invalid ObjectId", async () => {
    const req = {
      ...baseReq,
      user: { userId: "invalid-id", role: "ADMIN" },
    };

    const { res, jsonMock } = createRes();
    const next = vi.fn();

    const middleware = auditLog({ resourceType: "BOOK", action: "CREATE_BOOK" });
    await middleware(req, res, next);

    res.status(201);
    res.json({ success: true, data: { _id: "book5" } });

    expect(createMock).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalled();
  });
});
