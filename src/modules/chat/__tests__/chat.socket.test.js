/**
 * TASK-04.2.2 – chat.socket.handler.js + socket.service.js unit tests
 *
 * Tests cover:
 *   - JWT authentication (valid / missing / invalid token)
 *   - join_thread / leave_thread room authorization
 *   - send_message persistence, delivery receipts, push notifications
 *   - mark_delivered / mark_read receipt emission
 *   - get_unread_count queries
 *   - typing_start / typing_stop relay
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { verify: mockJwtVerify } = vi.hoisted(() => ({ verify: vi.fn() }));

const {
  authorizeThreadAccessMock,
  saveMessageMock,
  markMessagesDeliveredMock,
  markMessagesReadMock,
  getUnreadCountMock,
  getUserUnreadCountsMock,
} = vi.hoisted(() => ({
  authorizeThreadAccessMock: vi.fn(),
  saveMessageMock: vi.fn(),
  markMessagesDeliveredMock: vi.fn(),
  markMessagesReadMock: vi.fn(),
  getUnreadCountMock: vi.fn(),
  getUserUnreadCountsMock: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({ default: { verify: mockJwtVerify } }));

vi.mock("../services/chat.service.js", () => ({
  authorizeThreadAccess: authorizeThreadAccessMock,
  findOrCreateThread: vi.fn(),
  saveMessage: saveMessageMock,
  markMessagesDelivered: markMessagesDeliveredMock,
  markMessagesRead: markMessagesReadMock,
  getUnreadCount: getUnreadCountMock,
  getUserUnreadCounts: getUserUnreadCountsMock,
  getUserThreads: vi.fn().mockResolvedValue([]),
  getThreadMessages: vi.fn().mockResolvedValue({ messages: [], hasMore: false, nextCursor: null }),
}));

import {
  registerSocketHandlers,
  emitSessionRevoked,
  resetUserSockets,
} from "../services/socket.service.js";

// ---------------------------------------------------------------------------
// Socket / IO Helpers
// ---------------------------------------------------------------------------

const mkId = () => new mongoose.Types.ObjectId().toString();

const studentId = mkId();
const mentorId = mkId();
const threadId = mkId();
const messageId = mkId();

/**
 * Build a minimal mock socket.
 */
const buildSocket = (overrides = {}) => {
  const listeners = {};
  const socket = {
    userId: studentId,
    sessionId: "session-abc",
    userRole: "STUDENT",
    handshake: { auth: { token: "valid-token" } },
    emit: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    on: vi.fn((event, handler) => {
      listeners[event] = handler;
    }),
    _trigger: (event, ...args) => {
      if (listeners[event]) return listeners[event](...args);
    },
    ...overrides,
  };
  return socket;
};

/**
 * Build a minimal mock io server.
 */
const buildIo = (socket) => {
  const rooms = new Map();
  const allSockets = new Map();

  if (socket) {
    allSockets.set("socket-1", socket);
    socket._id = "socket-1";
  }

  const io = {
    use: vi.fn((middleware) => {
      if (socket) middleware(socket, () => {});
    }),
    on: vi.fn((event, handler) => {
      if (event === "connection" && socket) handler(socket);
    }),
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    sockets: {
      adapter: {
        rooms,
      },
      sockets: allSockets,
    },
  };
  return io;
};

beforeEach(() => {
  vi.clearAllMocks();
  resetUserSockets();
  mockJwtVerify.mockReturnValue({ userId: studentId, sid: "session-abc", role: "STUDENT" });
});

// ---------------------------------------------------------------------------
// Authentication Middleware (via registerSocketHandlers)
// ---------------------------------------------------------------------------

describe("Socket Authentication Middleware", () => {
  it("calls next() for a valid token", () => {
    const socket = buildSocket();
    const nextFn = vi.fn();
    const io = {
      use: vi.fn((middleware) => middleware(socket, nextFn)),
      on: vi.fn(),
    };
    registerSocketHandlers(io);
    expect(nextFn).toHaveBeenCalledWith();
    expect(socket.userId).toBe(studentId);
  });

  it("calls next(error) when token is missing", () => {
    const socket = buildSocket({ handshake: { auth: {} } });
    const nextFn = vi.fn();
    const io = {
      use: vi.fn((middleware) => middleware(socket, nextFn)),
      on: vi.fn(),
    };
    registerSocketHandlers(io);
    expect(nextFn).toHaveBeenCalledWith(expect.objectContaining({ message: "Authentication error" }));
  });

  it("calls next(error) for an invalid / expired token", () => {
    const socket = buildSocket();
    mockJwtVerify.mockImplementationOnce(() => { throw new Error("expired"); });
    const nextFn = vi.fn();
    const io = {
      use: vi.fn((middleware) => middleware(socket, nextFn)),
      on: vi.fn(),
    };
    registerSocketHandlers(io);
    expect(nextFn).toHaveBeenCalledWith(expect.objectContaining({ message: "Authentication error" }));
  });
});

// ---------------------------------------------------------------------------
// Connection: user room join + tracking
// ---------------------------------------------------------------------------

describe("Socket Connection", () => {
  it("joins the personal user room on connection", () => {
    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);
    expect(socket.join).toHaveBeenCalledWith(`user:${studentId}`);
  });

  it("registers chat event listeners on connection", () => {
    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);
    // socket.on should have been called for each chat event
    const registeredEvents = socket.on.mock.calls.map(([e]) => e);
    expect(registeredEvents).toContain("join_thread");
    expect(registeredEvents).toContain("send_message");
    expect(registeredEvents).toContain("mark_delivered");
    expect(registeredEvents).toContain("mark_read");
    expect(registeredEvents).toContain("typing_start");
    expect(registeredEvents).toContain("disconnect");
  });
});

// ---------------------------------------------------------------------------
// join_thread
// ---------------------------------------------------------------------------

describe("join_thread handler", () => {
  it("emits chat_error and calls ack with error when user is unauthorized", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: false,
      reason: "FORBIDDEN",
      message: "Not a participant",
    });

    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("join_thread", { threadId }, ack);

    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(socket.emit).toHaveBeenCalledWith("chat_error", expect.objectContaining({ success: false }));
    expect(socket.join).not.toHaveBeenCalledWith(`thread:${threadId}`);
  });

  it("joins the thread room and returns unread count on success", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: true,
      thread: { _id: threadId, status: "ACTIVE" },
      peerId: new mongoose.Types.ObjectId(mentorId),
    });
    markMessagesDeliveredMock.mockResolvedValue({ messageIds: [], deliveredAt: new Date() });
    getUnreadCountMock.mockResolvedValue(3);

    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("join_thread", { threadId }, ack);

    expect(socket.join).toHaveBeenCalledWith(`thread:${threadId}`);
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true, unreadCount: 3 }));
    expect(socket.emit).toHaveBeenCalledWith("thread_joined", expect.objectContaining({ unreadCount: 3 }));
  });

  it("emits messages_delivered to thread room when pending deliveries exist on join", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: true,
      thread: { _id: threadId, status: "ACTIVE" },
      peerId: new mongoose.Types.ObjectId(mentorId),
    });
    const deliveredMsgId = mkId();
    markMessagesDeliveredMock.mockResolvedValue({
      messageIds: [deliveredMsgId],
      deliveredAt: new Date(),
    });
    getUnreadCountMock.mockResolvedValue(2);

    const toEmitMock = vi.fn();
    const socket = buildSocket();
    const io = buildIo(socket);
    io.to = vi.fn().mockReturnValue({ emit: toEmitMock });
    registerSocketHandlers(io);

    await socket._trigger("join_thread", { threadId });

    expect(io.to).toHaveBeenCalledWith(`thread:${threadId}`);
    expect(toEmitMock).toHaveBeenCalledWith("messages_delivered", expect.objectContaining({
      messageIds: [deliveredMsgId],
    }));
  });

  it("works identically for the join_room alias", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: true,
      thread: { _id: threadId, status: "ACTIVE" },
      peerId: new mongoose.Types.ObjectId(mentorId),
    });
    markMessagesDeliveredMock.mockResolvedValue({ messageIds: [], deliveredAt: new Date() });
    getUnreadCountMock.mockResolvedValue(0);

    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("join_room", { threadId }, ack);

    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ---------------------------------------------------------------------------
// leave_thread
// ---------------------------------------------------------------------------

describe("leave_thread handler", () => {
  it("calls socket.leave with the thread room and acks success", () => {
    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    socket._trigger("leave_thread", { threadId }, ack);

    expect(socket.leave).toHaveBeenCalledWith(`thread:${threadId}`);
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ---------------------------------------------------------------------------
// send_message
// ---------------------------------------------------------------------------

describe("send_message handler", () => {
  const makeMsg = (overrides = {}) => ({
    _id: messageId,
    threadId,
    senderId: studentId,
    content: "Hello",
    messageType: "TEXT",
    attachments: [],
    deliveredAt: null,
    readAt: null,
    createdAt: new Date(),
    toObject: vi.fn().mockReturnThis(),
    ...overrides,
  });

  it("emits chat_error and acks with error when unauthorized", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: false,
      reason: "THREAD_NOT_FOUND",
      message: "Chat thread not found",
    });

    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("send_message", { threadId, content: "hi", clientMessageId: "cid-1" }, ack);

    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(socket.emit).toHaveBeenCalledWith("chat_error", expect.any(Object));
  });

  it("persists message and broadcasts to thread room", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: true,
      thread: { _id: threadId, status: "ACTIVE" },
      peerId: new mongoose.Types.ObjectId(mentorId),
    });
    const savedMsg = makeMsg();
    saveMessageMock.mockResolvedValue(savedMsg);
    getUnreadCountMock.mockResolvedValue(1);

    const toEmitMock = vi.fn();
    const socket = buildSocket();
    const io = buildIo(socket);
    io.to = vi.fn().mockReturnValue({ emit: toEmitMock });
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("send_message", {
      threadId,
      content: "Hello",
      clientMessageId: "cid-1",
    }, ack);

    expect(saveMessageMock).toHaveBeenCalledWith(expect.objectContaining({
      threadId,
      senderId: studentId,
      content: "Hello",
    }));
    expect(toEmitMock).toHaveBeenCalledWith("receive_message", expect.any(Object));
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true, clientMessageId: "cid-1" }));
  });

  it("emits chat_notification and unread_count_update to recipient user room when peer is offline", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: true,
      thread: { _id: threadId, status: "ACTIVE" },
      peerId: new mongoose.Types.ObjectId(mentorId),
    });
    const savedMsg = makeMsg();
    saveMessageMock.mockResolvedValue(savedMsg);
    getUnreadCountMock.mockResolvedValue(2);

    const toEmitFn = vi.fn();
    const socket = buildSocket();
    const io = buildIo(socket);
    // Simulate peer NOT in room: rooms map is empty
    io.sockets.adapter.rooms = new Map();
    io.to = vi.fn().mockReturnValue({ emit: toEmitFn });
    registerSocketHandlers(io);

    await socket._trigger("send_message", { threadId, content: "Hi" });

    // Check notification was sent to peer's user room
    const toCalls = io.to.mock.calls.map(([r]) => r);
    expect(toCalls).toContain(`user:${mentorId}`);
    expect(toEmitFn).toHaveBeenCalledWith("chat_notification", expect.objectContaining({ threadId }));
    expect(toEmitFn).toHaveBeenCalledWith("unread_count_update", expect.objectContaining({ unreadCount: 2 }));
  });

  it("propagates saveMessage errors to ack", async () => {
    authorizeThreadAccessMock.mockResolvedValue({
      authorized: true,
      thread: { _id: threadId, status: "ACTIVE" },
      peerId: new mongoose.Types.ObjectId(mentorId),
    });
    saveMessageMock.mockRejectedValue(new Error("DB failure"));

    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("send_message", { threadId, content: "Hi" }, ack);

    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: "DB failure" }));
  });
});

// ---------------------------------------------------------------------------
// mark_delivered
// ---------------------------------------------------------------------------

describe("mark_delivered handler", () => {
  it("emits messages_delivered to thread room on success", async () => {
    const deliveredId = mkId();
    markMessagesDeliveredMock.mockResolvedValue({
      messageIds: [deliveredId],
      deliveredAt: new Date(),
    });

    const toEmitFn = vi.fn();
    const socket = buildSocket();
    const io = buildIo(socket);
    io.to = vi.fn().mockReturnValue({ emit: toEmitFn });
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("mark_delivered", { threadId, messageIds: [deliveredId] }, ack);

    expect(toEmitFn).toHaveBeenCalledWith("messages_delivered", expect.objectContaining({
      messageIds: [deliveredId],
    }));
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("does NOT emit messages_delivered when no messages are updated", async () => {
    markMessagesDeliveredMock.mockResolvedValue({ messageIds: [], deliveredAt: new Date() });

    const toEmitFn = vi.fn();
    const socket = buildSocket();
    const io = buildIo(socket);
    io.to = vi.fn().mockReturnValue({ emit: toEmitFn });
    registerSocketHandlers(io);

    await socket._trigger("mark_delivered", { threadId });

    expect(toEmitFn).not.toHaveBeenCalledWith("messages_delivered", expect.any(Object));
  });
});

// ---------------------------------------------------------------------------
// mark_read
// ---------------------------------------------------------------------------

describe("mark_read handler", () => {
  it("emits messages_read to thread room and unread_count_update to user room", async () => {
    const readId = mkId();
    markMessagesReadMock.mockResolvedValue({
      messageIds: [readId],
      readAt: new Date(),
      unreadCount: 0,
    });

    const toEmitFn = vi.fn();
    const socket = buildSocket();
    const io = buildIo(socket);
    io.to = vi.fn().mockReturnValue({ emit: toEmitFn });
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("mark_read", { threadId, messageIds: [readId] }, ack);

    expect(io.to).toHaveBeenCalledWith(`thread:${threadId}`);
    expect(toEmitFn).toHaveBeenCalledWith("messages_read", expect.objectContaining({ messageIds: [readId] }));
    expect(io.to).toHaveBeenCalledWith(`user:${studentId}`);
    expect(toEmitFn).toHaveBeenCalledWith("unread_count_update", expect.objectContaining({ unreadCount: 0 }));
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true, unreadCount: 0 }));
  });
});

// ---------------------------------------------------------------------------
// get_unread_count
// ---------------------------------------------------------------------------

describe("get_unread_count handler", () => {
  it("returns thread-specific unread count when threadId is provided", async () => {
    getUnreadCountMock.mockResolvedValue(4);

    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("get_unread_count", { threadId }, ack);

    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true, unreadCount: 4 }));
    expect(socket.emit).toHaveBeenCalledWith("unread_count", expect.objectContaining({ threadId }));
  });

  it("returns global unread counts when threadId is not provided", async () => {
    getUserUnreadCountsMock.mockResolvedValue({ totalUnread: 10, unreadByThread: {} });

    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    const ack = vi.fn();
    await socket._trigger("get_unread_count", {}, ack);

    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ success: true, totalUnread: 10 }));
  });
});

// ---------------------------------------------------------------------------
// typing_start / typing_stop
// ---------------------------------------------------------------------------

describe("typing indicators", () => {
  it("broadcasts typing_start to thread room excluding sender", () => {
    const toEmitFn = vi.fn();
    const socket = buildSocket();
    socket.to = vi.fn().mockReturnValue({ emit: toEmitFn });
    const io = buildIo(socket);
    registerSocketHandlers(io);

    socket._trigger("typing_start", { threadId });

    expect(socket.to).toHaveBeenCalledWith(`thread:${threadId}`);
    expect(toEmitFn).toHaveBeenCalledWith("typing_start", { threadId, userId: studentId });
  });

  it("broadcasts typing_stop to thread room excluding sender", () => {
    const toEmitFn = vi.fn();
    const socket = buildSocket();
    socket.to = vi.fn().mockReturnValue({ emit: toEmitFn });
    const io = buildIo(socket);
    registerSocketHandlers(io);

    socket._trigger("typing_stop", { threadId });

    expect(socket.to).toHaveBeenCalledWith(`thread:${threadId}`);
    expect(toEmitFn).toHaveBeenCalledWith("typing_stop", { threadId, userId: studentId });
  });

  it("does not call socket.to when threadId is not provided", () => {
    const socket = buildSocket();
    const io = buildIo(socket);
    registerSocketHandlers(io);

    socket._trigger("typing_start", {});

    expect(socket.to).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// session_revoked backward compatibility
// ---------------------------------------------------------------------------

describe("emitSessionRevoked backward compatibility", () => {
  it("still emits session_revoked to the correct session sockets", () => {
    const socket = buildSocket({ sessionId: "session-old" });
    const io = buildIo(socket);
    mockJwtVerify.mockReturnValue({ userId: studentId, sid: "session-old", role: "STUDENT" });
    registerSocketHandlers(io);

    emitSessionRevoked(["session-old"]);

    expect(socket.emit).toHaveBeenCalledWith(
      "session_revoked",
      expect.objectContaining({ message: expect.stringContaining("terminated") })
    );
  });

  it("does NOT emit session_revoked to sockets from a different session", () => {
    const socketOld = buildSocket({ sessionId: "session-old" });
    const socketNew = buildSocket({ userId: mkId(), sessionId: "session-new" });

    const ioOld = buildIo(socketOld);
    mockJwtVerify.mockReturnValueOnce({ userId: studentId, sid: "session-old", role: "STUDENT" });
    registerSocketHandlers(ioOld);

    const ioNew = buildIo(socketNew);
    mockJwtVerify.mockReturnValueOnce({ userId: mkId(), sid: "session-new", role: "STUDENT" });
    registerSocketHandlers(ioNew);

    emitSessionRevoked(["session-old"]);

    expect(socketOld.emit).toHaveBeenCalledWith("session_revoked", expect.any(Object));
    expect(socketNew.emit).not.toHaveBeenCalledWith("session_revoked", expect.any(Object));
  });
});
