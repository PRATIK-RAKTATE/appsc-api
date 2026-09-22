
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";


const {
  getUserThreadsMock,
  findOrCreateThreadMock,
  getThreadMessagesMock,
  getUnreadCountMock,
  getUserUnreadCountsMock,
} = vi.hoisted(() => ({
  getUserThreadsMock: vi.fn(),
  findOrCreateThreadMock: vi.fn(),
  getThreadMessagesMock: vi.fn(),
  getUnreadCountMock: vi.fn(),
  getUserUnreadCountsMock: vi.fn(),
}));

vi.mock("../services/chat.service.js", () => ({
  getUserThreads: getUserThreadsMock,
  findOrCreateThread: findOrCreateThreadMock,
  getThreadMessages: getThreadMessagesMock,
  getUnreadCount: getUnreadCountMock,
  getUserUnreadCounts: getUserUnreadCountsMock,
  authorizeThreadAccess: vi.fn(),
  saveMessage: vi.fn(),
  markMessagesDelivered: vi.fn(),
  markMessagesRead: vi.fn(),
}));

import {
  getUserThreadsController,
  createOrGetThreadController,
  getThreadMessagesController,
  getUnreadCountController,
} from "../controllers/chat.controller.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mkId = () => new mongoose.Types.ObjectId().toString();

const studentId = mkId();
const mentorId = mkId();
const threadId = mkId();

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const makeReq = (overrides = {}) => ({
  user: { userId: studentId, role: "STUDENT" },
  params: {},
  query: {},
  body: {},
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});



describe("getUserThreadsController", () => {
  it("returns 200 with thread list", async () => {
    const threads = [{ _id: threadId, status: "ACTIVE", unreadCount: 2 }];
    getUserThreadsMock.mockResolvedValue(threads);

    const res = makeRes();
    await getUserThreadsController(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: threads });
  });

  it("returns 500 on service error", async () => {
    getUserThreadsMock.mockRejectedValue(new Error("DB failure"));

    const res = makeRes();
    await getUserThreadsController(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "DB failure" })
    );
  });
});

// ---------------------------------------------------------------------------
// createOrGetThreadController
// ---------------------------------------------------------------------------

describe("createOrGetThreadController", () => {
  it("returns 400 when studentId or mentorId is missing", async () => {
    const res = makeRes();
    await createOrGetThreadController(
      makeReq({ body: { studentId } }), // no mentorId
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining("required") })
    );
  });

  it("returns 400 when studentId is not a valid ObjectId", async () => {
    const res = makeRes();
    await createOrGetThreadController(
      makeReq({ body: { studentId: "bad-id", mentorId } }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 403 when a student tries to create a thread for someone else", async () => {
    const anotherStudentId = mkId();
    const res = makeRes();
    await createOrGetThreadController(
      makeReq({
        user: { userId: studentId, role: "STUDENT" },
        body: { studentId: anotherStudentId, mentorId },
      }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 403 when a mentor tries to create a thread where they are not the mentor", async () => {
    const anotherMentorId = mkId();
    const res = makeRes();
    await createOrGetThreadController(
      makeReq({
        user: { userId: mentorId, role: "MENTOR" },
        body: { studentId, mentorId: anotherMentorId },
      }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("allows a student to create a thread as themselves", async () => {
    const thread = { _id: threadId };
    findOrCreateThreadMock.mockResolvedValue(thread);

    const res = makeRes();
    await createOrGetThreadController(
      makeReq({
        user: { userId: studentId, role: "STUDENT" },
        body: { studentId, mentorId },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: thread });
  });

  it("allows a mentor to create a thread as themselves", async () => {
    const thread = { _id: threadId };
    findOrCreateThreadMock.mockResolvedValue(thread);

    const res = makeRes();
    await createOrGetThreadController(
      makeReq({
        user: { userId: mentorId, role: "MENTOR" },
        body: { studentId, mentorId },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("allows an ADMIN to create threads for anyone", async () => {
    const thread = { _id: threadId };
    findOrCreateThreadMock.mockResolvedValue(thread);
    const adminId = mkId();

    const res = makeRes();
    await createOrGetThreadController(
      makeReq({
        user: { userId: adminId, role: "ADMIN" },
        body: { studentId, mentorId },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("includes optional topicId", async () => {
    const topicId = mkId();
    const thread = { _id: threadId, topicId };
    findOrCreateThreadMock.mockResolvedValue(thread);

    const res = makeRes();
    await createOrGetThreadController(
      makeReq({
        user: { userId: studentId, role: "STUDENT" },
        body: { studentId, mentorId, topicId },
      }),
      res
    );

    expect(findOrCreateThreadMock).toHaveBeenCalledWith(
      expect.objectContaining({ topicId })
    );
  });

  it("returns 500 on service error", async () => {
    findOrCreateThreadMock.mockRejectedValue(new Error("Network error"));

    const res = makeRes();
    await createOrGetThreadController(
      makeReq({
        user: { userId: studentId, role: "STUDENT" },
        body: { studentId, mentorId },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getThreadMessagesController
// ---------------------------------------------------------------------------

describe("getThreadMessagesController", () => {
  it("returns 200 with message list and pagination metadata", async () => {
    const messages = [{ _id: mkId(), content: "Hello" }];
    getThreadMessagesMock.mockResolvedValue({
      messages,
      hasMore: false,
      nextCursor: null,
    });

    const res = makeRes();
    await getThreadMessagesController(
      makeReq({ params: { threadId }, query: { limit: "20" } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: messages,
      hasMore: false,
      nextCursor: null,
    });
    expect(getThreadMessagesMock).toHaveBeenCalledWith(
      expect.objectContaining({ threadId, userId: studentId, limit: "20" })
    );
  });

  it("returns 403 when service throws a 403 error", async () => {
    const err = new Error("Not a participant");
    err.status = 403;
    getThreadMessagesMock.mockRejectedValue(err);

    const res = makeRes();
    await getThreadMessagesController(
      makeReq({ params: { threadId } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 500 on unexpected service error", async () => {
    getThreadMessagesMock.mockRejectedValue(new Error("Unexpected"));

    const res = makeRes();
    await getThreadMessagesController(
      makeReq({ params: { threadId } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// getUnreadCountController
// ---------------------------------------------------------------------------

describe("getUnreadCountController", () => {
  it("returns total unread counts when no threadId query param is given", async () => {
    getUserUnreadCountsMock.mockResolvedValue({
      totalUnread: 7,
      unreadByThread: { [threadId]: 7 },
    });

    const res = makeRes();
    await getUnreadCountController(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ totalUnread: 7 }) })
    );
  });

  it("returns per-thread unread count when threadId query param is provided", async () => {
    getUnreadCountMock.mockResolvedValue(3);

    const res = makeRes();
    await getUnreadCountController(
      makeReq({ query: { threadId } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { threadId, unreadCount: 3 },
    });
  });

  it("returns 400 when threadId query param is invalid", async () => {
    const res = makeRes();
    await getUnreadCountController(
      makeReq({ query: { threadId: "bad-id" } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Invalid threadId" })
    );
  });

  it("returns 500 on service error", async () => {
    getUserUnreadCountsMock.mockRejectedValue(new Error("DB error"));

    const res = makeRes();
    await getUnreadCountController(makeReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
