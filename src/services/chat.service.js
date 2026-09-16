import mongoose from "mongoose";
import { ChatMessage, CHAT_MESSAGE_TYPE } from "../models/chatMessage.model.js";
import {
  StudentMentorThread,
  MENTOR_THREAD_STATUS,
} from "../models/studentMentorThread.model.js";
import { USER_ROLES } from "../models/user.model.js";

export const authorizeThreadAccess = async ({ threadId, userId, userRole }) => {
  if (!threadId || !mongoose.isValidObjectId(threadId)) {
    return {
      authorized: false,
      reason: "INVALID_THREAD_ID",
      message: "Invalid or missing threadId",
    };
  }

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return {
      authorized: false,
      reason: "INVALID_USER_ID",
      message: "Invalid or missing userId",
    };
  }

  const thread = await StudentMentorThread.findById(threadId);
  if (!thread) {
    return {
      authorized: false,
      reason: "THREAD_NOT_FOUND",
      message: "Chat thread not found",
    };
  }

  const userIdStr = userId.toString();
  const isStudent = thread.studentId.toString() === userIdStr;
  const isMentor = thread.mentorId.toString() === userIdStr;
  const isAdmin =
    userRole === USER_ROLES.ADMIN ||
    userRole === USER_ROLES.SUPER_ADMIN ||
    userRole === "SUPERADMIN";

  if (!isStudent && !isMentor && !isAdmin) {
    return {
      authorized: false,
      reason: "FORBIDDEN",
      message: "User is not a participant in this chat thread",
      thread,
    };
  }

  const peerId = isStudent ? thread.mentorId : thread.studentId;

  return {
    authorized: true,
    thread,
    isStudent,
    isMentor,
    peerId,
  };
};

export const findOrCreateThread = async ({ studentId, mentorId, topicId }) => {
  if (!studentId || !mongoose.isValidObjectId(studentId)) {
    throw new Error("Invalid studentId");
  }
  if (!mentorId || !mongoose.isValidObjectId(mentorId)) {
    throw new Error("Invalid mentorId");
  }
  if (studentId.toString() === mentorId.toString()) {
    throw new Error("Student and mentor cannot be the same user");
  }

  let thread = await StudentMentorThread.findOne({ studentId, mentorId });

  if (thread) {
    if (topicId && mongoose.isValidObjectId(topicId) && !thread.topicId) {
      thread.topicId = topicId;
      await thread.save();
    }
    return thread;
  }

  const createData = {
    studentId,
    mentorId,
    status: MENTOR_THREAD_STATUS.ACTIVE,
  };

  if (topicId && mongoose.isValidObjectId(topicId)) {
    createData.topicId = topicId;
  }

  thread = await StudentMentorThread.create(createData);
  return thread;
};

export const saveMessage = async ({
  threadId,
  senderId,
  content,
  messageType = CHAT_MESSAGE_TYPE.TEXT,
  attachments = [],
  isDelivered = false,
}) => {
  const auth = await authorizeThreadAccess({ threadId, userId: senderId });
  if (!auth.authorized) {
    const error = new Error(auth.message);
    error.status = auth.reason === "THREAD_NOT_FOUND" ? 404 : 403;
    error.reason = auth.reason;
    throw error;
  }

  if (auth.thread.status === MENTOR_THREAD_STATUS.CLOSED) {
    const error = new Error("Chat thread is closed");
    error.status = 400;
    error.reason = "THREAD_CLOSED";
    throw error;
  }

  const trimmedContent = typeof content === "string" ? content.trim() : undefined;
  const hasContent = Boolean(trimmedContent && trimmedContent.length > 0);
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!hasContent && !hasAttachments) {
    const error = new Error("Message must contain text content or attachments");
    error.status = 400;
    error.reason = "EMPTY_MESSAGE";
    throw error;
  }

  if (!Object.values(CHAT_MESSAGE_TYPE).includes(messageType)) {
    const error = new Error(`Invalid messageType: ${messageType}`);
    error.status = 400;
    error.reason = "INVALID_MESSAGE_TYPE";
    throw error;
  }

  const now = new Date();
  const messageData = {
    threadId,
    senderId,
    messageType,
    attachments,
  };

  if (hasContent) {
    messageData.content = trimmedContent;
  }

  if (isDelivered) {
    messageData.deliveredAt = now;
  }

  const message = await ChatMessage.create(messageData);

  await StudentMentorThread.findByIdAndUpdate(threadId, {
    lastMessageAt: message.createdAt || now,
  });

  return message;
};

export const markMessagesDelivered = async ({ threadId, userId, messageIds }) => {
  const auth = await authorizeThreadAccess({ threadId, userId });
  if (!auth.authorized) {
    const error = new Error(auth.message);
    error.status = auth.reason === "THREAD_NOT_FOUND" ? 404 : 403;
    throw error;
  }

  const query = {
    threadId,
    senderId: { $ne: userId },
    deliveredAt: null,
    isDeleted: false,
  };

  if (Array.isArray(messageIds) && messageIds.length > 0) {
    query._id = { $in: messageIds.filter((id) => mongoose.isValidObjectId(id)) };
  }

  const messagesToUpdate = await ChatMessage.find(query, { _id: 1 });
  const updatedIds = messagesToUpdate.map((m) => m._id.toString());

  const now = new Date();
  if (updatedIds.length > 0) {
    await ChatMessage.updateMany(
      { _id: { $in: updatedIds } },
      { $set: { deliveredAt: now } }
    );
  }

  return {
    messageIds: updatedIds,
    deliveredAt: now,
  };
};

export const markMessagesRead = async ({ threadId, userId, messageIds }) => {
  const auth = await authorizeThreadAccess({ threadId, userId });
  if (!auth.authorized) {
    const error = new Error(auth.message);
    error.status = auth.reason === "THREAD_NOT_FOUND" ? 404 : 403;
    throw error;
  }

  const query = {
    threadId,
    senderId: { $ne: userId },
    readAt: null,
    isDeleted: false,
  };

  if (Array.isArray(messageIds) && messageIds.length > 0) {
    query._id = { $in: messageIds.filter((id) => mongoose.isValidObjectId(id)) };
  }

  const messagesToUpdate = await ChatMessage.find(query, { _id: 1, deliveredAt: 1 });
  const updatedIds = messagesToUpdate.map((m) => m._id.toString());

  const now = new Date();
  if (updatedIds.length > 0) {
    await ChatMessage.updateMany(
      { _id: { $in: updatedIds } },
      [
        {
          $set: {
            readAt: now,
            deliveredAt: { $ifNull: ["$deliveredAt", now] },
          },
        },
      ]
    );
  }

  const unreadCount = await getUnreadCount({ threadId, userId });

  return {
    messageIds: updatedIds,
    readAt: now,
    unreadCount,
  };
};

export const getUnreadCount = async ({ threadId, userId }) => {
  if (!threadId || !userId) return 0;
  return ChatMessage.countDocuments({
    threadId,
    senderId: { $ne: userId },
    readAt: null,
    isDeleted: false,
  });
};

export const getUserUnreadCounts = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return { totalUnread: 0, unreadByThread: {} };
  }

  const threads = await StudentMentorThread.find(
    {
      $or: [{ studentId: userId }, { mentorId: userId }],
    },
    { _id: 1 }
  );

  const threadIds = threads.map((t) => t._id);
  if (threadIds.length === 0) {
    return { totalUnread: 0, unreadByThread: {} };
  }

  const aggregation = await ChatMessage.aggregate([
    {
      $match: {
        threadId: { $in: threadIds },
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        readAt: null,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$threadId",
        count: { $sum: 1 },
      },
    },
  ]);

  const unreadByThread = {};
  let totalUnread = 0;

  for (const item of aggregation) {
    const tId = item._id.toString();
    unreadByThread[tId] = item.count;
    totalUnread += item.count;
  }

  return {
    totalUnread,
    unreadByThread,
  };
};

export const getThreadMessages = async ({
  threadId,
  userId,
  userRole,
  limit = 50,
  before,
}) => {
  const auth = await authorizeThreadAccess({ threadId, userId, userRole });
  if (!auth.authorized) {
    const error = new Error(auth.message);
    error.status = auth.reason === "THREAD_NOT_FOUND" ? 404 : 403;
    throw error;
  }

  const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100);
  const query = {
    threadId,
    isDeleted: false,
  };

  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }

  const rawMessages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(parsedLimit + 1)
    .populate("senderId", "name email role avatar");

  const hasMore = rawMessages.length > parsedLimit;
  const messagesSlice = hasMore ? rawMessages.slice(0, parsedLimit) : rawMessages;

  const messages = messagesSlice.reverse();
  const nextCursor = hasMore && messagesSlice.length > 0 ? messagesSlice[0].createdAt.toISOString() : null;

  return {
    messages,
    hasMore,
    nextCursor,
  };
};

export const getUserThreads = async (userId) => {
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return [];
  }

  const threads = await StudentMentorThread.find({
    $or: [{ studentId: userId }, { mentorId: userId }],
  })
    .populate("studentId", "name email role avatar")
    .populate("mentorId", "name email role avatar")
    .populate("topicId", "topicName topicKey")
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  const { unreadByThread } = await getUserUnreadCounts(userId);

  const result = [];
  for (const thread of threads) {
    const threadObj = thread.toObject();
    const threadIdStr = thread._id.toString();
    threadObj.unreadCount = unreadByThread[threadIdStr] || 0;

    const latestMessage = await ChatMessage.findOne(
      { threadId: thread._id, isDeleted: false },
      { content: 1, messageType: 1, senderId: 1, createdAt: 1, deliveredAt: 1, readAt: 1 }
    ).sort({ createdAt: -1 });

    threadObj.lastMessage = latestMessage || null;
    result.push(threadObj);
  }

  return result;
};
