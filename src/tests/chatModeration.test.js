import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import { User, USER_ROLES, USER_STATUS } from "../models/user.model.js";
import { StudentMentorThread, MENTOR_THREAD_STATUS } from "../models/studentMentorThread.model.js";
import { ChatMessage, CHAT_MESSAGE_TYPE } from "../models/chatMessage.model.js";
import { ChatReport, REPORT_REASON, REPORT_STATUS } from "../models/chatReport.model.js";
import { ModerationLog, MODERATION_ACTION } from "../models/moderationLog.model.js";

let mongoServer;
const JWT_SECRET = "test-jwt-secret-key";

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = JWT_SECRET;
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

describe("Chat Moderation, Reporting & Audit Subsystem (TASK-04.4.2)", () => {
  let studentUser;
  let mentorUser;
  let otherStudentUser;
  let adminUser;
  let superAdminUser;

  let studentToken;
  let mentorToken;
  let otherStudentToken;
  let adminToken;
  let superAdminToken;

  let thread;
  let studentMessage;
  let mentorMessage;

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await StudentMentorThread.deleteMany({});
    await ChatMessage.deleteMany({});
    await ChatReport.deleteMany({});
    await ModerationLog.deleteMany({});

    // Create users
    studentUser = await User.create({
      name: "Student Alice",
      email: "alice@example.com",
      phone: "1111111111",
      role: USER_ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      tokenVersion: 0,
    });

    mentorUser = await User.create({
      name: "Mentor Bob",
      email: "bob@example.com",
      phone: "2222222222",
      role: USER_ROLES.MENTOR,
      status: USER_STATUS.ACTIVE,
      tokenVersion: 0,
    });

    otherStudentUser = await User.create({
      name: "Other Student Charlie",
      email: "charlie@example.com",
      phone: "3333333333",
      role: USER_ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
      tokenVersion: 0,
    });

    adminUser = await User.create({
      name: "Admin Dave",
      email: "dave@example.com",
      phone: "4444444444",
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      tokenVersion: 0,
    });

    superAdminUser = await User.create({
      name: "Super Admin Eve",
      email: "eve@example.com",
      phone: "5555555555",
      role: USER_ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      tokenVersion: 0,
    });

    studentToken = generateToken(studentUser);
    mentorToken = generateToken(mentorUser);
    otherStudentToken = generateToken(otherStudentUser);
    adminToken = generateToken(adminUser);
    superAdminToken = generateToken(superAdminUser);

    // Create thread between studentUser and mentorUser
    thread = await StudentMentorThread.create({
      studentId: studentUser._id,
      mentorId: mentorUser._id,
      status: MENTOR_THREAD_STATUS.ACTIVE,
      lastMessageAt: new Date(),
    });

    // Create messages in the thread
    studentMessage = await ChatMessage.create({
      threadId: thread._id,
      senderId: studentUser._id,
      content: "Hello mentor, I have a question about the test.",
      messageType: CHAT_MESSAGE_TYPE.TEXT,
    });

    mentorMessage = await ChatMessage.create({
      threadId: thread._id,
      senderId: mentorUser._id,
      content: "Here is inappropriate content that violates policy.",
      messageType: CHAT_MESSAGE_TYPE.TEXT,
    });
  });

  describe("In-Chat Message Reporting (Students & Mentors)", () => {
    it("should allow a student to report a mentor message via POST /api/chat/reports", async () => {
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: mentorMessage._id.toString(),
          reason: REPORT_REASON.HARASSMENT,
          description: "Mentor was rude and violated guidelines.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.reporterId.toString()).toBe(studentUser._id.toString());
      expect(res.body.data.reportedUserId.toString()).toBe(mentorUser._id.toString());
      expect(res.body.data.messageId.toString()).toBe(mentorMessage._id.toString());
      expect(res.body.data.chatId.toString()).toBe(thread._id.toString());
      expect(res.body.data.reason).toBe(REPORT_REASON.HARASSMENT);
      expect(res.body.data.status).toBe(REPORT_STATUS.PENDING);
    });

    it("should allow reporting via POST /api/chat/messages/:messageId/report", async () => {
      const res = await request(app)
        .post(`/api/chat/messages/${mentorMessage._id}/report`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          reason: REPORT_REASON.SPAM,
          description: "Promotional link spam",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reason).toBe(REPORT_REASON.SPAM);
    });

    it("should allow a mentor to report a student message", async () => {
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({
          messageId: studentMessage._id.toString(),
          reason: REPORT_REASON.INAPPROPRIATE_CONTENT,
          description: "Inappropriate language in student question.",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reporterId.toString()).toBe(mentorUser._id.toString());
      expect(res.body.data.reportedUserId.toString()).toBe(studentUser._id.toString());
    });

    it("should reject message reporting if the user is not a participant in the chat thread", async () => {
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${otherStudentToken}`)
        .send({
          messageId: mentorMessage._id.toString(),
          reason: REPORT_REASON.HARASSMENT,
          description: "I'm not in this thread but reporting.",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("not authorized");
    });

    it("should prevent self-reporting of own message", async () => {
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: studentMessage._id.toString(),
          reason: REPORT_REASON.HARASSMENT,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot report your own message");
    });

    it("should prevent duplicate active reports for the same message", async () => {
      // First report
      await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: mentorMessage._id.toString(),
          reason: REPORT_REASON.HARASSMENT,
        });

      // Second duplicate report
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: mentorMessage._id.toString(),
          reason: REPORT_REASON.SPAM,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already reported");
    });

    it("should handle duplicate-report race conditions safely via database constraint", async () => {
      // Create index in DB
      await ChatReport.syncIndexes();

      // Trigger parallel simultaneous report calls
      const results = await Promise.all([
        request(app)
          .post("/api/chat/reports")
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ messageId: mentorMessage._id.toString(), reason: REPORT_REASON.HARASSMENT }),
        request(app)
          .post("/api/chat/reports")
          .set("Authorization", `Bearer ${studentToken}`)
          .send({ messageId: mentorMessage._id.toString(), reason: REPORT_REASON.HARASSMENT }),
      ]);

      const statusCodes = results.map((r) => r.status).sort();
      expect(statusCodes).toEqual([201, 409]);

      // Exactly 1 report in DB
      const reportCount = await ChatReport.countDocuments({
        reporterId: studentUser._id,
        messageId: mentorMessage._id,
      });
      expect(reportCount).toBe(1);
    });

    it("should validate report reason enum", async () => {
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: mentorMessage._id.toString(),
          reason: "NOT_A_VALID_REASON",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid report reason");
    });

    it("should return 404 if the message does not exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: nonExistentId,
          reason: REPORT_REASON.HARASSMENT,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Message not found");
    });

    it("should return 400 if message ID format is invalid", async () => {
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: "not-an-objectid",
          reason: REPORT_REASON.HARASSMENT,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject description exceeding 1000 characters", async () => {
      const longDescription = "a".repeat(1001);
      const res = await request(app)
        .post("/api/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          messageId: mentorMessage._id.toString(),
          reason: REPORT_REASON.HARASSMENT,
          description: longDescription,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("1000 characters");
    });
  });

  describe("Admin Moderation Panel: Listing & Querying Reports", () => {
    let report1, report2;

    beforeEach(async () => {
      report1 = await ChatReport.create({
        reporterId: studentUser._id,
        reportedUserId: mentorUser._id,
        messageId: mentorMessage._id,
        chatId: thread._id,
        reason: REPORT_REASON.HARASSMENT,
        description: "Severe harassment during doubt solving",
        status: REPORT_STATUS.PENDING,
      });

      report2 = await ChatReport.create({
        reporterId: mentorUser._id,
        reportedUserId: studentUser._id,
        messageId: studentMessage._id,
        chatId: thread._id,
        reason: REPORT_REASON.SPAM,
        description: "Repetitive spam",
        status: REPORT_STATUS.RESOLVED,
      });
    });

    it("should reject non-admin users from accessing admin reports", async () => {
      const res = await request(app)
        .get("/api/admin/chat/reports")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it("should allow SUPER_ADMIN to list and inspect reports", async () => {
      const res = await request(app)
        .get("/api/admin/chat/reports")
        .set("Authorization", `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should list all reports with pagination for admin", async () => {
      const res = await request(app)
        .get("/api/admin/chat/reports?page=1&limit=10")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.pages).toBe(1);
      expect(res.body.data[0].reporterId).toHaveProperty("name");
      expect(res.body.data[0].reportedUserId).toHaveProperty("name");
      expect(res.body.data[0].messageId).toHaveProperty("content");
    });

    it("should filter reports by status", async () => {
      const res = await request(app)
        .get(`/api/admin/chat/reports?status=${REPORT_STATUS.PENDING}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe(REPORT_STATUS.PENDING);
      expect(res.body.data[0].reason).toBe(REPORT_REASON.HARASSMENT);
    });

    it("should filter reports by reason", async () => {
      const res = await request(app)
        .get(`/api/admin/chat/reports?reason=${REPORT_REASON.SPAM}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].reason).toBe(REPORT_REASON.SPAM);
    });

    it("should return 400 when invalid filter IDs are passed to getReports", async () => {
      const res1 = await request(app)
        .get("/api/admin/chat/reports?chatId=invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get("/api/admin/chat/reports?reportedUserId=invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get("/api/admin/chat/reports?reporterId=invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res3.status).toBe(400);

      const res4 = await request(app)
        .get("/api/admin/chat/reports?startDate=invalid-date")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res4.status).toBe(400);
    });

    it("should safely handle pagination extremes (page=0, page=99999, limit=9999)", async () => {
      const res1 = await request(app)
        .get("/api/admin/chat/reports?page=0&limit=-5")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res1.status).toBe(200);
      expect(res1.body.pagination.page).toBe(1);
      expect(res1.body.pagination.limit).toBe(10);

      const res2 = await request(app)
        .get("/api/admin/chat/reports?page=99999&limit=1000")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(0);
      expect(res2.body.pagination.page).toBe(99999);
      expect(res2.body.pagination.limit).toBe(100); // Clamped to 100
    });

    it("should search reports using text keyword with ReDoS-safe regex", async () => {
      const res = await request(app)
        .get("/api/admin/chat/reports?search=doubt")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].description).toContain("doubt solving");

      // Special regex character should be safely escaped
      const res2 = await request(app)
        .get("/api/admin/chat/reports?search=.*+?")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(0);
    });

    it("should get single report by ID with populated details and moderation logs", async () => {
      const res = await request(app)
        .get(`/api/admin/chat/reports/${report1._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id.toString()).toBe(report1._id.toString());
      expect(res.body.data.reporterId.name).toBe("Student Alice");
      expect(res.body.data.reportedUserId.name).toBe("Mentor Bob");
      expect(res.body.data.messageId.content).toContain("inappropriate");
      expect(Array.isArray(res.body.data.moderationLogs)).toBe(true);
    });

    it("should return 400 for malformed report ID", async () => {
      const res = await request(app)
        .get("/api/admin/chat/reports/not-a-valid-id")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid report ID");
    });

    it("should return 404 for non-existent report ID", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/admin/chat/reports/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Admin Moderation: Resolving Flags and Taking Actions", () => {
    let pendingReport;

    beforeEach(async () => {
      pendingReport = await ChatReport.create({
        reporterId: studentUser._id,
        reportedUserId: mentorUser._id,
        messageId: mentorMessage._id,
        chatId: thread._id,
        reason: REPORT_REASON.HATE_SPEECH,
        description: "Hate speech in chat",
        status: REPORT_STATUS.PENDING,
      });
    });

    it("should resolve a flag with adminNotes and resolution", async () => {
      const res = await request(app)
        .patch(`/api/admin/chat/reports/${pendingReport._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: REPORT_STATUS.RESOLVED,
          adminNotes: "Investigated conversation history. Mentor instructed on etiquette.",
          resolution: "Warned mentor privately.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(REPORT_STATUS.RESOLVED);
      expect(res.body.data.adminNotes).toContain("Investigated conversation");
      expect(res.body.data.resolution).toBe("Warned mentor privately.");
      expect(res.body.data.reviewedBy.toString()).toBe(adminUser._id.toString());
      expect(res.body.data.reviewedAt).toBeDefined();
    });

    it("should allow SUPER_ADMIN to resolve flags", async () => {
      const res = await request(app)
        .patch(`/api/admin/chat/reports/${pendingReport._id}`)
        .set("Authorization", `Bearer ${superAdminToken}`)
        .send({
          status: REPORT_STATUS.RESOLVED,
          resolution: "Super admin resolved",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviewedBy.toString()).toBe(superAdminUser._id.toString());
    });

    it("should return 400 when patching with invalid report ID", async () => {
      const res = await request(app)
        .patch("/api/admin/chat/reports/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: REPORT_STATUS.RESOLVED });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid report ID");
    });

    it("should also support POST /api/admin/chat/reports/:id/resolve", async () => {
      const res = await request(app)
        .post(`/api/admin/chat/reports/${pendingReport._id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: REPORT_STATUS.DISMISSED,
          adminNotes: "False alarm",
          resolution: "Dismissed without action",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(REPORT_STATUS.DISMISSED);
    });

    it("should record a ModerationLog when taking moderation action WARNING", async () => {
      const res = await request(app)
        .patch(`/api/admin/chat/reports/${pendingReport._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: MODERATION_ACTION.WARNING,
          actionNotes: "Official first warning issued to mentor.",
        });

      expect(res.status).toBe(200);
      expect(res.body.moderationLog).toBeDefined();
      expect(res.body.moderationLog.action).toBe(MODERATION_ACTION.WARNING);
      expect(res.body.moderationLog.notes).toBe("Official first warning issued to mentor.");

      // Check DB entry
      const logInDb = await ModerationLog.findOne({ chatReportId: pendingReport._id });
      expect(logInDb).toBeDefined();
      expect(logInDb.action).toBe(MODERATION_ACTION.WARNING);
      expect(logInDb.actionTakenBy.toString()).toBe(adminUser._id.toString());
      expect(logInDb.reportedUserId.toString()).toBe(mentorUser._id.toString());
    });

    it("should ban user and bump tokenVersion when action is USER_BANNED", async () => {
      const res = await request(app)
        .patch(`/api/admin/chat/reports/${pendingReport._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: MODERATION_ACTION.USER_BANNED,
          actionNotes: "Banned for severe hate speech violation.",
        });

      expect(res.status).toBe(200);
      expect(res.body.moderationLog.action).toBe(MODERATION_ACTION.USER_BANNED);

      // Verify user in DB is banned
      const bannedUser = await User.findById(mentorUser._id);
      expect(bannedUser.status).toBe(USER_STATUS.BANNED);
      expect(bannedUser.suspendedReason).toContain("Banned for severe hate speech");
      expect(bannedUser.tokenVersion).toBe(1);
    });

    it("should soft delete message and preserve original content in audit archive on MESSAGE_DELETED", async () => {
      const originalContent = mentorMessage.content;

      const res = await request(app)
        .patch(`/api/admin/chat/reports/${pendingReport._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          action: MODERATION_ACTION.MESSAGE_DELETED,
          actionNotes: "Deleted inappropriate message.",
        });

      expect(res.status).toBe(200);
      expect(res.body.moderationLog.action).toBe(MODERATION_ACTION.MESSAGE_DELETED);

      // Verify message is soft-deleted but original content is preserved
      const deletedMessage = await ChatMessage.findById(mentorMessage._id);
      expect(deletedMessage.content).toBe(originalContent);
      expect(deletedMessage.isDeleted).toBe(true);
      expect(deletedMessage.deletedAt).toBeDefined();
    });
  });

  describe("Searchable Chat Audit Archive & Thread Transcripts", () => {
    beforeEach(async () => {
      // Create additional messages for audit transcript
      await ChatMessage.create([
        {
          threadId: thread._id,
          senderId: studentUser._id,
          content: "Can you explain question 5 on the mock exam?",
          messageType: CHAT_MESSAGE_TYPE.TEXT,
          createdAt: new Date("2026-09-01T10:00:00Z"),
        },
        {
          threadId: thread._id,
          senderId: mentorUser._id,
          content: "Sure! Let's review the formula for quadratic equations.",
          messageType: CHAT_MESSAGE_TYPE.TEXT,
          createdAt: new Date("2026-09-01T10:05:00Z"),
        },
        {
          threadId: thread._id,
          senderId: studentUser._id,
          content: "Thank you, that formula makes total sense now.",
          messageType: CHAT_MESSAGE_TYPE.TEXT,
          createdAt: new Date("2026-09-01T10:10:00Z"),
        },
      ]);

      // Create a moderation log
      await ModerationLog.create({
        chatId: thread._id,
        reportedUserId: mentorUser._id,
        action: MODERATION_ACTION.WARNING,
        actionTakenBy: adminUser._id,
        notes: "Audit test warning note",
      });
    });

    it("should query moderation audit logs with filters and search", async () => {
      const res = await request(app)
        .get("/api/admin/chat/audit-logs?search=Audit test")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].notes).toContain("Audit test warning note");
      expect(res.body.data[0].actionTakenBy.name).toBe("Admin Dave");
    });

    it("should return 400 for invalid query parameters in audit logs", async () => {
      const res1 = await request(app)
        .get("/api/admin/chat/audit-logs?action=INVALID_ACTION")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get("/api/admin/chat/audit-logs?chatId=not-an-id")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);

      const res3 = await request(app)
        .get("/api/admin/chat/audit-logs?reportedUserId=not-an-id")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res3.status).toBe(400);

      const res4 = await request(app)
        .get("/api/admin/chat/audit-logs?actionTakenBy=not-an-id")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res4.status).toBe(400);
    });

    it("should list student-mentor threads with user search for admin", async () => {
      const res = await request(app)
        .get("/api/admin/chat/threads?search=Alice")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].studentId.name).toBe("Student Alice");
      expect(res.body.data[0].mentorId.name).toBe("Mentor Bob");
    });

    it("should handle thread search when no users match", async () => {
      const res = await request(app)
        .get("/api/admin/chat/threads?search=NonExistentPersonXYZ")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
      expect(res.body.pagination.total).toBe(0);
    });

    it("should return 400 when invalid studentId or mentorId is passed to getThreads", async () => {
      const res1 = await request(app)
        .get("/api/admin/chat/threads?studentId=invalid")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get("/api/admin/chat/threads?mentorId=invalid")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);
    });

    it("should query full thread transcript for admin in chronological order", async () => {
      const res = await request(app)
        .get(`/api/admin/chat/threads/${thread._id}/transcript?sort=asc`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.thread).toBeDefined();
      expect(res.body.data.messages.length).toBe(5); // 2 from setup + 3 added
      expect(res.body.data.messages[0].senderId).toHaveProperty("name");
    });

    it("should return 400 for invalid threadId in getThreadTranscript", async () => {
      const res = await request(app)
        .get("/api/admin/chat/threads/invalid-thread-id/transcript")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid thread ID");
    });

    it("should return 400 for invalid senderId or date in getThreadTranscript", async () => {
      const res1 = await request(app)
        .get(`/api/admin/chat/threads/${thread._id}/transcript?senderId=invalid`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get(`/api/admin/chat/threads/${thread._id}/transcript?startDate=invalid-date`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);
    });

    it("should search within thread transcript by keyword", async () => {
      const res = await request(app)
        .get(`/api/admin/chat/threads/${thread._id}/transcript?search=formula`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages.length).toBe(2);
      expect(res.body.data.messages[0].content).toContain("formula");
    });

    it("should filter thread transcript by date range", async () => {
      const res = await request(app)
        .get(`/api/admin/chat/threads/${thread._id}/transcript?startDate=2026-09-01T09:00:00Z&endDate=2026-09-01T10:06:00Z`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.messages.length).toBe(2);
    });

    it("should search across all messages in audit archive via /api/admin/chat/messages/search", async () => {
      const res = await request(app)
        .get("/api/admin/chat/messages/search?search=quadratic")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].content).toContain("quadratic equations");
      expect(res.body.data[0].senderId.name).toBe("Mentor Bob");
      expect(res.body.data[0].threadId).toBeDefined();
    });

    it("should return 400 when invalid threadId or senderId is passed to searchAuditMessages", async () => {
      const res1 = await request(app)
        .get("/api/admin/chat/messages/search?search=test&threadId=invalid")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app)
        .get("/api/admin/chat/messages/search?search=test&senderId=invalid")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res2.status).toBe(400);
    });

    it("should require search query in /api/admin/chat/messages/search", async () => {
      const res = await request(app)
        .get("/api/admin/chat/messages/search")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Search query is required");
    });
  });
});
