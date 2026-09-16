import mongoose from "mongoose";
import { ChatReport, REPORT_REASON, REPORT_STATUS } from "../models/chatReport.model.js";
import { ModerationLog, MODERATION_ACTION } from "../models/moderationLog.model.js";
import { ChatMessage } from "../models/chatMessage.model.js";
import { StudentMentorThread } from "../models/studentMentorThread.model.js";
import { User, USER_ROLES, USER_STATUS } from "../models/user.model.js";

// Escape regex special characters to prevent ReDoS
const escapeRegex = (string) => {
  if (!string) return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Safe integer parsing for pagination
const parsePagination = (page, limit, defaultLimit = 10, maxLimit = 100) => {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const pageNum = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const limitNum = isNaN(parsedLimit) || parsedLimit < 1 ? defaultLimit : Math.min(maxLimit, parsedLimit);
  const skip = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, skip };
};

// @desc    Report a chat message (Students and Mentors)
// @route   POST /api/chat/reports
// @route   POST /api/chat/messages/:messageId/report
export const reportMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId || req.body.messageId;
    const { reason, description } = req.body;

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid message ID is required",
      });
    }

    if (!reason || !Object.values(REPORT_REASON).includes(reason)) {
      return res.status(400).json({
        success: false,
        message: `Invalid report reason. Must be one of: ${Object.values(REPORT_REASON).join(", ")}`,
      });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters",
      });
    }

    // Find the message
    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Find the chat thread
    const thread = await StudentMentorThread.findById(message.threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Chat thread not found",
      });
    }

    const currentUserId = req.user.userId;
    const isStudent = thread.studentId.toString() === currentUserId;
    const isMentor = thread.mentorId.toString() === currentUserId;
    const isAdmin = [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(req.user.role);

    // Authorization: User must be a participant in the thread or an admin
    if (!isStudent && !isMentor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to report messages in this chat",
      });
    }

    // Edge case: Cannot report your own message
    if (message.senderId.toString() === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot report your own message",
      });
    }

    // Avoid duplicate reports for the same message from the same reporter
    const existingActiveReport = await ChatReport.findOne({
      reporterId: currentUserId,
      messageId: message._id,
      status: { $in: [REPORT_STATUS.PENDING, REPORT_STATUS.UNDER_REVIEW] },
    });

    if (existingActiveReport) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this message",
        data: existingActiveReport,
      });
    }

    const report = await ChatReport.create({
      reporterId: currentUserId,
      reportedUserId: message.senderId,
      messageId: message._id,
      chatId: thread._id,
      reason,
      description: description ? description.trim() : undefined,
      status: REPORT_STATUS.PENDING,
    });

    return res.status(201).json({
      success: true,
      message: "Message reported successfully",
      data: report,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this message",
      });
    }
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    List flagged reports/conversations (Admin)
// @route   GET /api/admin/chat/reports
export const getReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      reason,
      chatId,
      reportedUserId,
      reporterId,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (status) {
      if (!Object.values(REPORT_STATUS).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(REPORT_STATUS).join(", ")}`,
        });
      }
      query.status = status;
    }

    if (reason) {
      if (!Object.values(REPORT_REASON).includes(reason)) {
        return res.status(400).json({
          success: false,
          message: `Invalid reason. Must be one of: ${Object.values(REPORT_REASON).join(", ")}`,
        });
      }
      query.reason = reason;
    }

    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: "Invalid chatId" });
      }
      query.chatId = chatId;
    }

    if (reportedUserId) {
      if (!mongoose.Types.ObjectId.isValid(reportedUserId)) {
        return res.status(400).json({ success: false, message: "Invalid reportedUserId" });
      }
      query.reportedUserId = reportedUserId;
    }

    if (reporterId) {
      if (!mongoose.Types.ObjectId.isValid(reporterId)) {
        return res.status(400).json({ success: false, message: "Invalid reporterId" });
      }
      query.reporterId = reporterId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid startDate" });
        }
        query.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid endDate" });
        }
        query.createdAt.$lte = parsedEnd;
      }
    }

    if (search) {
      const escapedSearch = escapeRegex(search.trim());
      query.$or = [
        { description: { $regex: escapedSearch, $options: "i" } },
        { adminNotes: { $regex: escapedSearch, $options: "i" } },
        { resolution: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 10, 100);

    const [reports, total] = await Promise.all([
      ChatReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("reporterId", "name email role")
        .populate("reportedUserId", "name email role status")
        .populate({ path: "messageId", model: "ChatMessage", select: "content messageType attachments createdAt isDeleted deletedAt" })
        .populate({ path: "chatId", model: "StudentMentorThread", select: "studentId mentorId status" })
        .populate("reviewedBy", "name email role")
        .lean(),
      ChatReport.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    Get report details by ID (Admin)
// @route   GET /api/admin/chat/reports/:id
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await ChatReport.findById(id)
      .populate("reporterId", "name email role")
      .populate("reportedUserId", "name email role status")
      .populate({ path: "messageId", model: "ChatMessage", select: "content messageType attachments createdAt isDeleted deletedAt" })
      .populate({
        path: "chatId",
        model: "StudentMentorThread",
        populate: [
          { path: "studentId", select: "name email role" },
          { path: "mentorId", select: "name email role" },
        ],
      })
      .populate("reviewedBy", "name email role")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const moderationLogs = await ModerationLog.find({ chatReportId: id })
      .populate("actionTakenBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...report,
        moderationLogs,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    Resolve or moderate a flagged report (Admin)
// @route   PATCH /api/admin/chat/reports/:id
// @route   POST /api/admin/chat/reports/:id/resolve
export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolution, action, actionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID",
      });
    }

    const report = await ChatReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (status && !Object.values(REPORT_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(REPORT_STATUS).join(", ")}`,
      });
    }

    if (action && !Object.values(MODERATION_ACTION).includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid moderation action. Must be one of: ${Object.values(MODERATION_ACTION).join(", ")}`,
      });
    }

    // Determine resolved status
    let finalStatus = status;
    if (!finalStatus) {
      if (action === MODERATION_ACTION.REPORT_DISMISSED) {
        finalStatus = REPORT_STATUS.DISMISSED;
      } else if (action) {
        finalStatus = REPORT_STATUS.RESOLVED;
      }
    }

    if (finalStatus) {
      report.status = finalStatus;
    }

    report.reviewedBy = req.user.userId;
    report.reviewedAt = new Date();

    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }
    if (resolution !== undefined) {
      report.resolution = resolution;
    }

    let createdModerationLog = null;

    if (action) {
      const logNotes = actionNotes || adminNotes || resolution || `Action ${action} executed by moderator`;

      createdModerationLog = await ModerationLog.create({
        chatReportId: report._id,
        chatId: report.chatId,
        messageId: report.messageId,
        reportedUserId: report.reportedUserId,
        action,
        actionTakenBy: req.user.userId,
        notes: logNotes,
      });

      // Side-effects based on action
      if (action === MODERATION_ACTION.USER_BANNED) {
        const userToBan = await User.findById(report.reportedUserId);
        if (userToBan) {
          userToBan.status = USER_STATUS.BANNED;
          userToBan.suspendedReason = logNotes;
          userToBan.tokenVersion = (userToBan.tokenVersion || 0) + 1;
          await userToBan.save();
        }
      } else if (action === MODERATION_ACTION.MESSAGE_DELETED) {
        // Soft delete: preserve original content for audit archive while setting isDeleted flag
        const msgToDelete = await ChatMessage.findById(report.messageId);
        if (msgToDelete) {
          msgToDelete.isDeleted = true;
          msgToDelete.deletedAt = new Date();
          await msgToDelete.save();
        }
      }
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report updated successfully",
      data: report,
      moderationLog: createdModerationLog,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    Query moderation audit logs (Admin)
// @route   GET /api/admin/chat/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      action,
      chatId,
      reportedUserId,
      actionTakenBy,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (action) {
      if (!Object.values(MODERATION_ACTION).includes(action)) {
        return res.status(400).json({
          success: false,
          message: `Invalid action. Must be one of: ${Object.values(MODERATION_ACTION).join(", ")}`,
        });
      }
      query.action = action;
    }

    if (chatId) {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ success: false, message: "Invalid chatId" });
      }
      query.chatId = chatId;
    }

    if (reportedUserId) {
      if (!mongoose.Types.ObjectId.isValid(reportedUserId)) {
        return res.status(400).json({ success: false, message: "Invalid reportedUserId" });
      }
      query.reportedUserId = reportedUserId;
    }

    if (actionTakenBy) {
      if (!mongoose.Types.ObjectId.isValid(actionTakenBy)) {
        return res.status(400).json({ success: false, message: "Invalid actionTakenBy ID" });
      }
      query.actionTakenBy = actionTakenBy;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid startDate" });
        }
        query.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid endDate" });
        }
        query.createdAt.$lte = parsedEnd;
      }
    }

    if (search) {
      const escaped = escapeRegex(search.trim());
      query.notes = { $regex: escaped, $options: "i" };
    }

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 10, 100);

    const [logs, total] = await Promise.all([
      ModerationLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("actionTakenBy", "name email role")
        .populate("reportedUserId", "name email role")
        .populate("chatReportId", "reason status")
        .populate({ path: "chatId", model: "StudentMentorThread", select: "studentId mentorId status" })
        .populate({ path: "messageId", model: "ChatMessage", select: "content messageType isDeleted deletedAt" })
        .lean(),
      ModerationLog.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    List & search student-mentor threads (Admin)
// @route   GET /api/admin/chat/threads
export const getThreads = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, studentId, mentorId, search } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: "Invalid studentId" });
      }
      query.studentId = studentId;
    }

    if (mentorId) {
      if (!mongoose.Types.ObjectId.isValid(mentorId)) {
        return res.status(400).json({ success: false, message: "Invalid mentorId" });
      }
      query.mentorId = mentorId;
    }

    if (search) {
      const escaped = escapeRegex(search.trim());
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
        ],
      })
        .select("_id")
        .limit(100);

      const userIds = matchedUsers.map((u) => u._id);
      if (userIds.length === 0) {
        query._id = null; // safely matches 0 records
      } else {
        query.$or = [{ studentId: { $in: userIds } }, { mentorId: { $in: userIds } }];
      }
    }

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 10, 100);

    const [threads, total] = await Promise.all([
      StudentMentorThread.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("studentId", "name email phone role")
        .populate("mentorId", "name email phone role")
        .lean(),
      StudentMentorThread.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: threads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    Query thread transcripts for audit (Admin)
// @route   GET /api/admin/chat/threads/:threadId/transcript
// @route   GET /api/admin/chat/transcripts/:threadId
export const getThreadTranscript = async (req, res) => {
  try {
    const { threadId } = req.params;
    const {
      search,
      messageType,
      senderId,
      startDate,
      endDate,
      sort = "asc",
      page = 1,
      limit = 50,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(threadId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid thread ID",
      });
    }

    const thread = await StudentMentorThread.findById(threadId)
      .populate("studentId", "name email role")
      .populate("mentorId", "name email role")
      .lean();

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: "Chat thread not found",
      });
    }

    const msgQuery = { threadId: thread._id };

    if (search) {
      const escaped = escapeRegex(search.trim());
      msgQuery.content = { $regex: escaped, $options: "i" };
    }

    if (messageType) {
      msgQuery.messageType = messageType;
    }

    if (senderId) {
      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ success: false, message: "Invalid senderId" });
      }
      msgQuery.senderId = senderId;
    }

    if (startDate || endDate) {
      msgQuery.createdAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid startDate" });
        }
        msgQuery.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid endDate" });
        }
        msgQuery.createdAt.$lte = parsedEnd;
      }
    }

    const sortOrder = sort.toLowerCase() === "desc" ? -1 : 1;
    const { pageNum, limitNum, skip } = parsePagination(page, limit, 50, 200);

    const [messages, total] = await Promise.all([
      ChatMessage.find(msgQuery)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate("senderId", "name email role")
        .lean(),
      ChatMessage.countDocuments(msgQuery),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        thread,
        messages,
      },
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// @desc    Search across all messages in audit archive (Admin)
// @route   GET /api/admin/chat/messages/search
export const searchAuditMessages = async (req, res) => {
  try {
    const { search, threadId, senderId, startDate, endDate, page = 1, limit = 20 } = req.query;

    if (!search || !search.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const escaped = escapeRegex(search.trim());
    const query = {
      content: { $regex: escaped, $options: "i" },
    };

    if (threadId) {
      if (!mongoose.Types.ObjectId.isValid(threadId)) {
        return res.status(400).json({ success: false, message: "Invalid threadId" });
      }
      query.threadId = threadId;
    }

    if (senderId) {
      if (!mongoose.Types.ObjectId.isValid(senderId)) {
        return res.status(400).json({ success: false, message: "Invalid senderId" });
      }
      query.senderId = senderId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid startDate" });
        }
        query.createdAt.$gte = parsedStart;
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (isNaN(parsedEnd.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid endDate" });
        }
        query.createdAt.$lte = parsedEnd;
      }
    }

    const { pageNum, limitNum, skip } = parsePagination(page, limit, 20, 100);

    const [messages, total] = await Promise.all([
      ChatMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("senderId", "name email role")
        .populate({
          path: "threadId",
          select: "studentId mentorId status",
          populate: [
            { path: "studentId", select: "name email role" },
            { path: "mentorId", select: "name email role" },
          ],
        })
        .lean(),
      ChatMessage.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
