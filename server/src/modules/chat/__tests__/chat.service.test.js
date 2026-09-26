/**
 * TASK-04.2.2 – chat.service.js unit tests
 *
 * All MongoDB calls are mocked via vi.mock so these tests run without a
 * real database connection.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Hoisted mocks (must precede any import that pulls in the real models)
// ---------------------------------------------------------------------------

const {
  chatMessageFindMock,
  chatMessageFindOneMock,
  chatMessageCountDocumentsMock,
  chatMessageCreateMock,
  chatMessageUpdateManyMock,
  chatMessageAggregateMock,
  studentMentorThreadFindOneMock,
  studentMentorThreadFindMock,
  studentMentorThreadFindByIdMock,
  studentMentorThreadFindByIdAndUpdateMock,
  studentMentorThreadCreateMock,
} = vi.hoisted(() => ({
  chatMessageFindMock: vi.fn(),
  chatMessageFindOneMock: vi.fn(),
  chatMessageCountDocumentsMock: vi.fn(),
  chatMessageCreateMock: vi.fn(),
  chatMessageUpdateManyMock: vi.fn(),
  chatMessageAggregateMock: vi.fn(),
  studentMentorThreadFindOneMock: vi.fn(),
  studentMentorThreadFindMock: vi.fn(),
  studentMentorThreadFindByIdMock: vi.fn(),
  studentMentorThreadFindByIdAndUpdateMock: vi.fn(),
  studentMentorThreadCreateMock: vi.fn(),
}));

vi.mock("../models/chatMessage.model.js", () => ({
  CHAT_MESSAGE_TYPE: {
    TEXT: "TEXT",
    IMAGE: "IMAGE",
    FILE: "FILE",
    VOICE: "VOICE",
  },
  ChatMessage: {
    find: chatMessageFindMock,
    findOne: chatMessageFindOneMock,
    countDocuments: chatMessageCountDocumentsMock,
    create: chatMessageCreateMock,
    updateMany: chatMessageUpdateManyMock,
    aggregate: chatMessageAggregateMock,
  },
}));

vi.mock("../../mentors/index.js", () => ({
  MENTOR_THREAD_STATUS: {
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED",
  },
  StudentMentorThread: {
    findOne: studentMentorThreadFindOneMock,
    find: studentMentorThreadFindMock,
    findById: studentMentorThreadFindByIdMock,
    findByIdAndUpdate: studentMentorThreadFindByIdAndUpdateMock,
    create: studentMentorThreadCreateMock,
  },
}));

import {
  authorizeThreadAccess,
  findOrCreateThread,
  saveMessage,
  markMessagesDelivered,
  markMessagesRead,
  getUnreadCount,
  getUserUnreadCounts,
  getThreadMessages,
  getUserThreads,
} from "../services/chat.service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mkId = () => new mongoose.Types.ObjectId().toString();

const studentId = mkId();
const mentorId = mkId();
const threadId = mkId();
const messageId = mkId();

const makeThread = (overrides = {}) => ({
  _id: threadId,
  studentId: new mongoose.Types.ObjectId(studentId),
  mentorId: new mongoose.Types.ObjectId(mentorId),
  status: "ACTIVE",
  lastMessageAt: null,
  topicId: null,
  save: vi.fn().mockResolvedValue(true),
  toObject: vi.fn().mockReturnThis(),
  ...overrides,
});

const makeMessage = (overrides = {}) => ({
  _id: messageId,
  threadId,
  senderId: studentId,
  content: "Hello",
  messageType: "TEXT",
  attachments: [],
  deliveredAt: null,
  readAt: null,
  isDeleted: false,
  createdAt: new Date(),
  toObject: vi.fn().mockReturnThis(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// authorizeThreadAccess
// ---------------------------------------------------------------------------

describe("authorizeThreadAccess", () => {
  it("returns INVALID_THREAD_ID for a missing threadId", async () => {
    const result = await authorizeThreadAccess({ threadId: null, userId: studentId });
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("INVALID_THREAD_ID");
  });

  it("returns INVALID_THREAD_ID for a non-ObjectId threadId", async () => {
    const result = await authorizeThreadAccess({ threadId: "not-an-id", userId: studentId });
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("INVALID_THREAD_ID");
  });

  it("returns INVALID_USER_ID for a missing userId", async () => {
    const result = await authorizeThreadAccess({ threadId, userId: null });
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("INVALID_USER_ID");
  });

  it("returns THREAD_NOT_FOUND when thread does not exist", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(null);
    const result = await authorizeThreadAccess({ threadId, userId: studentId });
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("THREAD_NOT_FOUND");
  });

  it("returns FORBIDDEN when user is not a participant", async () => {
    const thirdUserId = mkId();
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const result = await authorizeThreadAccess({ threadId, userId: thirdUserId });
    expect(result.authorized).toBe(false);
    expect(result.reason).toBe("FORBIDDEN");
  });

  it("authorizes a student participant", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const result = await authorizeThreadAccess({ threadId, userId: studentId });
    expect(result.authorized).toBe(true);
    expect(result.isStudent).toBe(true);
    expect(result.isMentor).toBe(false);
    expect(result.peerId.toString()).toBe(mentorId);
  });

  it("authorizes a mentor participant", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const result = await authorizeThreadAccess({ threadId, userId: mentorId });
    expect(result.authorized).toBe(true);
    expect(result.isMentor).toBe(true);
    expect(result.peerId.toString()).toBe(studentId);
  });

  it("authorizes an admin user even if not a participant", async () => {
    const adminId = mkId();
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const result = await authorizeThreadAccess({
      threadId,
      userId: adminId,
      userRole: "ADMIN",
    });
    expect(result.authorized).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// findOrCreateThread
// ---------------------------------------------------------------------------

describe("findOrCreateThread", () => {
  it("throws on invalid studentId", async () => {
    await expect(
      findOrCreateThread({ studentId: "bad", mentorId })
    ).rejects.toThrow("Invalid studentId");
  });

  it("throws on invalid mentorId", async () => {
    await expect(
      findOrCreateThread({ studentId, mentorId: "bad" })
    ).rejects.toThrow("Invalid mentorId");
  });

  it("throws when studentId and mentorId are the same", async () => {
    await expect(
      findOrCreateThread({ studentId, mentorId: studentId })
    ).rejects.toThrow("Student and mentor cannot be the same user");
  });

  it("returns an existing thread", async () => {
    const thread = makeThread();
    studentMentorThreadFindOneMock.mockResolvedValue(thread);
    const result = await findOrCreateThread({ studentId, mentorId });
    expect(result).toBe(thread);
    expect(studentMentorThreadCreateMock).not.toHaveBeenCalled();
  });

  it("creates a new thread when none exists", async () => {
    studentMentorThreadFindOneMock.mockResolvedValue(null);
    const newThread = makeThread();
    studentMentorThreadCreateMock.mockResolvedValue(newThread);
    const result = await findOrCreateThread({ studentId, mentorId });
    expect(studentMentorThreadCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ studentId, mentorId, status: "ACTIVE" })
    );
    expect(result).toBe(newThread);
  });

  it("includes topicId when creating a new thread", async () => {
    const topicId = mkId();
    studentMentorThreadFindOneMock.mockResolvedValue(null);
    const newThread = makeThread({ topicId });
    studentMentorThreadCreateMock.mockResolvedValue(newThread);
    await findOrCreateThread({ studentId, mentorId, topicId });
    expect(studentMentorThreadCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ topicId })
    );
  });
});

// ---------------------------------------------------------------------------
// saveMessage
// ---------------------------------------------------------------------------

describe("saveMessage", () => {
  it("rejects when thread is not found", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(null);
    await expect(
      saveMessage({ threadId, senderId: studentId, content: "hi" })
    ).rejects.toThrow("Chat thread not found");
  });

  it("rejects when user is not a participant", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const thirdId = mkId();
    await expect(
      saveMessage({ threadId, senderId: thirdId, content: "hi" })
    ).rejects.toThrow("not a participant");
  });

  it("rejects when thread is CLOSED", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread({ status: "CLOSED" }));
    await expect(
      saveMessage({ threadId, senderId: studentId, content: "hi" })
    ).rejects.toThrow("Chat thread is closed");
  });

  it("rejects empty message with no content and no attachments", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    await expect(
      saveMessage({ threadId, senderId: studentId, content: "   ", attachments: [] })
    ).rejects.toThrow("text content or attachments");
  });

  it("rejects invalid messageType", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    await expect(
      saveMessage({ threadId, senderId: studentId, content: "hi", messageType: "VIDEO" })
    ).rejects.toThrow("Invalid messageType");
  });

  it("persists a valid text message and updates thread lastMessageAt", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const savedMsg = makeMessage();
    chatMessageCreateMock.mockResolvedValue(savedMsg);
    studentMentorThreadFindByIdAndUpdateMock.mockResolvedValue(true);

    const result = await saveMessage({ threadId, senderId: studentId, content: "Hello" });

    expect(chatMessageCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId,
        senderId: studentId,
        content: "Hello",
        messageType: "TEXT",
      })
    );
    expect(studentMentorThreadFindByIdAndUpdateMock).toHaveBeenCalledWith(
      threadId,
      expect.objectContaining({ lastMessageAt: expect.any(Date) })
    );
    expect(result).toBe(savedMsg);
  });

  it("sets deliveredAt when isDelivered is true", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const savedMsg = makeMessage({ deliveredAt: new Date() });
    chatMessageCreateMock.mockResolvedValue(savedMsg);
    studentMentorThreadFindByIdAndUpdateMock.mockResolvedValue(true);

    await saveMessage({ threadId, senderId: studentId, content: "Hi", isDelivered: true });

    expect(chatMessageCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ deliveredAt: expect.any(Date) })
    );
  });

  it("trims whitespace from content", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    chatMessageCreateMock.mockResolvedValue(makeMessage());
    studentMentorThreadFindByIdAndUpdateMock.mockResolvedValue(true);

    await saveMessage({ threadId, senderId: studentId, content: "  Hello  " });

    expect(chatMessageCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Hello" })
    );
  });
});

// ---------------------------------------------------------------------------
// markMessagesDelivered
// ---------------------------------------------------------------------------

describe("markMessagesDelivered", () => {
  it("rejects for unauthorized user", async () => {
    const thirdId = mkId();
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    await expect(
      markMessagesDelivered({ threadId, userId: thirdId })
    ).rejects.toThrow();
  });

  it("marks undelivered messages and returns their IDs", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const msgs = [{ _id: new mongoose.Types.ObjectId() }];
    chatMessageFindMock.mockResolvedValue(msgs);
    chatMessageUpdateManyMock.mockResolvedValue({ modifiedCount: 1 });

    const result = await markMessagesDelivered({ threadId, userId: mentorId });

    expect(chatMessageUpdateManyMock).toHaveBeenCalled();
    expect(result.messageIds.length).toBe(1);
    expect(result.deliveredAt).toBeInstanceOf(Date);
  });

  it("returns empty array when no messages need delivery", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    chatMessageFindMock.mockResolvedValue([]);

    const result = await markMessagesDelivered({ threadId, userId: mentorId });

    expect(chatMessageUpdateManyMock).not.toHaveBeenCalled();
    expect(result.messageIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// markMessagesRead
// ---------------------------------------------------------------------------

describe("markMessagesRead", () => {
  it("rejects for unauthorized user", async () => {
    const thirdId = mkId();
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    await expect(
      markMessagesRead({ threadId, userId: thirdId })
    ).rejects.toThrow();
  });

  it("marks unread messages and returns updated unread count", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    const msgs = [{ _id: new mongoose.Types.ObjectId(), deliveredAt: null }];
    chatMessageFindMock.mockResolvedValue(msgs);
    chatMessageUpdateManyMock.mockResolvedValue({ modifiedCount: 1 });
    chatMessageCountDocumentsMock.mockResolvedValue(0);

    const result = await markMessagesRead({ threadId, userId: mentorId });

    expect(chatMessageUpdateManyMock).toHaveBeenCalled();
    expect(result.readAt).toBeInstanceOf(Date);
    expect(result.messageIds.length).toBe(1);
    expect(result.unreadCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getUnreadCount
// ---------------------------------------------------------------------------

describe("getUnreadCount", () => {
  it("returns 0 when threadId or userId is missing", async () => {
    const result = await getUnreadCount({ threadId: null, userId: studentId });
    expect(result).toBe(0);
  });

  it("delegates to ChatMessage.countDocuments and returns the count", async () => {
    chatMessageCountDocumentsMock.mockResolvedValue(5);
    const result = await getUnreadCount({ threadId, userId: mentorId });
    expect(result).toBe(5);
    expect(chatMessageCountDocumentsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId,
        senderId: { $ne: mentorId },
        readAt: null,
        isDeleted: false,
      })
    );
  });
});

// ---------------------------------------------------------------------------
// getUserUnreadCounts
// ---------------------------------------------------------------------------

describe("getUserUnreadCounts", () => {
  it("returns zero totals for invalid userId", async () => {
    const result = await getUserUnreadCounts("not-an-id");
    expect(result.totalUnread).toBe(0);
    expect(result.unreadByThread).toEqual({});
  });

  it("returns zero when user has no threads", async () => {
    studentMentorThreadFindMock.mockResolvedValue([]);
    const result = await getUserUnreadCounts(studentId);
    expect(result.totalUnread).toBe(0);
  });

  it("aggregates unread counts across threads", async () => {
    const tid1 = new mongoose.Types.ObjectId();
    const tid2 = new mongoose.Types.ObjectId();
    studentMentorThreadFindMock.mockResolvedValue([{ _id: tid1 }, { _id: tid2 }]);
    chatMessageAggregateMock.mockResolvedValue([
      { _id: tid1, count: 3 },
      { _id: tid2, count: 7 },
    ]);

    const result = await getUserUnreadCounts(studentId);

    expect(result.totalUnread).toBe(10);
    expect(result.unreadByThread[tid1.toString()]).toBe(3);
    expect(result.unreadByThread[tid2.toString()]).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// getThreadMessages
// ---------------------------------------------------------------------------

describe("getThreadMessages", () => {
  it("rejects when user is not a participant", async () => {
    const thirdId = mkId();
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());
    await expect(
      getThreadMessages({ threadId, userId: thirdId })
    ).rejects.toThrow();
  });

  it("returns paginated messages in chronological order", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());

    const msgs = [
      { ...makeMessage(), createdAt: new Date("2026-01-01T10:00:00Z") },
      { ...makeMessage(), _id: mkId(), createdAt: new Date("2026-01-01T10:01:00Z") },
    ];

    // build chain: find().sort().limit().populate()
    const populateMock = vi.fn().mockResolvedValue(msgs);
    const limitMock = vi.fn().mockReturnValue({ populate: populateMock });
    const sortMock = vi.fn().mockReturnValue({ limit: limitMock });
    chatMessageFindMock.mockReturnValue({ sort: sortMock });

    const result = await getThreadMessages({ threadId, userId: studentId, limit: 50 });

    expect(result.hasMore).toBe(false);
    expect(result.messages).toHaveLength(2);
  });

  it("signals hasMore when results exceed limit", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());

    // Return limit+1 messages to signal hasMore
    const msgs = Array.from({ length: 3 }, (_, i) => ({
      ...makeMessage(),
      _id: mkId(),
      createdAt: new Date(`2026-01-01T10:0${i}:00Z`),
    }));

    const populateMock = vi.fn().mockResolvedValue(msgs);
    const limitMock = vi.fn().mockReturnValue({ populate: populateMock });
    const sortMock = vi.fn().mockReturnValue({ limit: limitMock });
    chatMessageFindMock.mockReturnValue({ sort: sortMock });

    const result = await getThreadMessages({ threadId, userId: studentId, limit: 2 });

    expect(result.hasMore).toBe(true);
    expect(result.messages).toHaveLength(2);
    expect(result.nextCursor).toBeTruthy();
  });

  it("applies the 'before' cursor for pagination", async () => {
    studentMentorThreadFindByIdMock.mockResolvedValue(makeThread());

    const populateMock = vi.fn().mockResolvedValue([]);
    const limitMock = vi.fn().mockReturnValue({ populate: populateMock });
    const sortMock = vi.fn().mockReturnValue({ limit: limitMock });
    chatMessageFindMock.mockReturnValue({ sort: sortMock });

    await getThreadMessages({
      threadId,
      userId: studentId,
      before: "2026-01-01T12:00:00Z",
    });

    expect(chatMessageFindMock).toHaveBeenCalledWith(
      expect.objectContaining({
        createdAt: { $lt: expect.any(Date) },
      })
    );
  });
});

// ---------------------------------------------------------------------------
// getUserThreads
// ---------------------------------------------------------------------------

describe("getUserThreads", () => {
  it("returns empty array for invalid userId", async () => {
    const result = await getUserThreads("not-an-id");
    expect(result).toEqual([]);
  });

  it("returns thread list with unread counts and last messages", async () => {
    const thread = makeThread();
    thread.toObject = vi.fn().mockReturnValue({ _id: threadId, status: "ACTIVE" });

    // Call 1 in getUserThreads: StudentMentorThread.find().populate().populate().populate().sort()
    const sortMock = vi.fn().mockResolvedValue([thread]);
    const populate3 = vi.fn().mockReturnValue({ sort: sortMock });
    const populate2 = vi.fn().mockReturnValue({ populate: populate3 });
    const populate1 = vi.fn().mockReturnValue({ populate: populate2 });

    // Queue call 1 (populate chain) and call 2 (array of thread IDs for getUserUnreadCounts)
    studentMentorThreadFindMock
      .mockReturnValueOnce({ populate: populate1 })
      .mockResolvedValueOnce([{ _id: new mongoose.Types.ObjectId(threadId) }]);

    chatMessageAggregateMock.mockResolvedValue([
      { _id: new mongoose.Types.ObjectId(threadId), count: 3 },
    ]);
    chatMessageFindOneMock.mockReturnValue({
      sort: vi.fn().mockResolvedValue({ content: "Hello", messageType: "TEXT" }),
    });

    const result = await getUserThreads(studentId);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].unreadCount).toBe(3);
    expect(result[0].lastMessage).toEqual({ content: "Hello", messageType: "TEXT" });
  });
});
