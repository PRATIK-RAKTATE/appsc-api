import * as chatService from "../services/chat.service.js";
import mongoose from "mongoose";
import { USER_ROLES } from "../../users/index.js";

export const getUserThreadsController = async (req, res) => {
  try {
    const userId = req.user.userId;
    const threads = await chatService.getUserThreads(userId);

    return res.status(200).json({
      success: true,
      data: threads,
    });
  } catch (error) {
    console.error("Get user threads error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch threads",
    });
  }
};

export const createOrGetThreadController = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { studentId, mentorId, topicId } = req.body;

    if (!studentId || !mentorId) {
      return res.status(400).json({
        success: false,
        message: "studentId and mentorId are required",
      });
    }

    if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid studentId or mentorId",
      });
    }

    const isAdmin = role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;
    const isStudentSelf = role === USER_ROLES.STUDENT && studentId === userId;
    const isMentorSelf = role === USER_ROLES.MENTOR && mentorId === userId;

    if (!isAdmin && !isStudentSelf && !isMentorSelf) {
      return res.status(403).json({
        success: false,
        message: "You can only create a thread on behalf of yourself",
      });
    }

    const thread = await chatService.findOrCreateThread({
      studentId,
      mentorId,
      topicId,
    });

    return res.status(200).json({
      success: true,
      data: thread,
    });
  } catch (error) {
    console.error("Create or get thread error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create or get thread",
    });
  }
};

export const getThreadMessagesController = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { threadId } = req.params;
    const { limit, before } = req.query;

    const result = await chatService.getThreadMessages({
      threadId,
      userId,
      userRole: role,
      limit,
      before,
    });

    return res.status(200).json({
      success: true,
      data: result.messages,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    console.error("Get thread messages error:", error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

export const getUnreadCountController = async (req, res) => {
  try {
    const { userId } = req.user;
    const { threadId } = req.query;

    if (threadId) {
      if (!mongoose.isValidObjectId(threadId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid threadId",
        });
      }
      const unreadCount = await chatService.getUnreadCount({ threadId, userId });
      return res.status(200).json({
        success: true,
        data: { threadId, unreadCount },
      });
    }

    const data = await chatService.getUserUnreadCounts(userId);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch unread count",
    });
  }
};
