import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, USER_ROLES, USER_STATUS } from "../models/user.model.js";
import { Course } from "../../courses/index.js";
import { UserSession } from "../../auth/index.js";
import { UserEntitlement } from "../../entitlements/index.js";
import { TestSubmission, SUBMISSION_STATUS } from "../../exams/index.js";
import {
  getUsers,
  getUserDetail,
  updateUserStatus,
  revokeUserSessions
} from "../controllers/adminUser.controller.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

describe("Admin User Controller", () => {
  const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const adminId = new mongoose.Types.ObjectId();
  const superAdminId = new mongoose.Types.ObjectId();

  describe("getUsers", () => {
    beforeEach(async () => {
      await User.create([
        { name: "John Doe", email: "john@test.com", phone: "1234567890", role: USER_ROLES.STUDENT },
        { name: "Jane Smith", email: "jane@test.com", phone: "0987654321", role: USER_ROLES.MENTOR },
      ]);
    });

    it("should list users with pagination", async () => {
      const req = { query: { page: "1", limit: "10" } };
      const res = mockResponse();

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.data.length).toBe(2);
      expect(resData.pagination.total).toBe(2);
    });

    it("should search users by name or email (escaped regex)", async () => {
      // Searching for "john.doe" with special chars
      const req = { query: { search: "john." } };
      const res = mockResponse();

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.data.length).toBe(0); // "john." will be escaped as "john\.", won't match "John Doe"
      
      const req2 = { query: { search: "john" } };
      const res2 = mockResponse();
      await getUsers(req2, res2);
      const resData2 = res2.json.mock.calls[0][0];
      expect(resData2.data.length).toBe(1);
      expect(resData2.data[0].name).toBe("John Doe");
    });
  });

  describe("getUserDetail", () => {
    let student;
    beforeEach(async () => {
      student = await User.create({
        name: "Test Student", email: "student@test.com", role: USER_ROLES.STUDENT
      });

      const courseId = new mongoose.Types.ObjectId();
      const testId = new mongoose.Types.ObjectId();
      const orderId = new mongoose.Types.ObjectId();

      await UserEntitlement.create({
        userId: student._id,
        courseId,
        orderId,
        expiresAt: new Date(Date.now() + 86400000)
      });

      await TestSubmission.create({
        studentId: student._id,
        testId,
        status: SUBMISSION_STATUS.SUBMITTED,
        score: 85,
        correctCount: 8,
        incorrectCount: 2,
        unattemptedCount: 0
      });
      await TestSubmission.create({
        studentId: student._id,
        testId,
        status: SUBMISSION_STATUS.SUBMITTED,
        score: 95,
        correctCount: 9,
        incorrectCount: 1,
        unattemptedCount: 0
      });
    });

    it("should get user details with course enrollments and test stats", async () => {
      const req = { params: { id: student._id.toString() } };
      const res = mockResponse();

      await getUserDetail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const resData = res.json.mock.calls[0][0];
      expect(resData.data.name).toBe("Test Student");
      expect(resData.data.enrollments.length).toBe(1);
      expect(resData.data.testStats.totalTests).toBe(2);
      expect(resData.data.testStats.avgScore).toBe(90);
    });
  });

  describe("updateUserStatus", () => {
    let targetUser;
    beforeEach(async () => {
      targetUser = await User.create({
        name: "Target User", email: "target@test.com", role: USER_ROLES.STUDENT
      });
      
      await User.create({
        _id: superAdminId, name: "Super", email: "super@test.com", role: USER_ROLES.SUPER_ADMIN
      });
    });

    it("should prevent self-suspension", async () => {
      const req = {
        params: { id: adminId.toString() },
        body: { status: USER_STATUS.SUSPENDED },
        user: { userId: adminId.toString() } // Self
      };
      const res = mockResponse();

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Cannot modify own status" }));
    });

    it("should prevent modifying SUPER_ADMIN status", async () => {
      const req = {
        params: { id: superAdminId.toString() },
        body: { status: USER_STATUS.SUSPENDED },
        user: { userId: adminId.toString() }
      };
      const res = mockResponse();

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Cannot modify SUPER_ADMIN status" }));
    });

    it("should update status and bump tokenVersion when suspended", async () => {
      const req = {
        params: { id: targetUser._id.toString() },
        body: { status: USER_STATUS.SUSPENDED, suspendedReason: "Spam" },
        user: { userId: adminId.toString() }
      };
      const res = mockResponse();

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const updatedUser = await User.findById(targetUser._id);
      expect(updatedUser.status).toBe(USER_STATUS.SUSPENDED);
      expect(updatedUser.suspendedReason).toBe("Spam");
      expect(updatedUser.tokenVersion).toBe(1); // Bumped
    });
  });

  describe("revokeUserSessions", () => {
    let targetUser;
    beforeEach(async () => {
      targetUser = await User.create({
        name: "Revoke User", email: "revoke@test.com", role: USER_ROLES.STUDENT
      });

      await UserSession.create({
        userId: targetUser._id,
        refreshTokenHash: "hash",
        expiresAt: new Date(Date.now() + 86400000)
      });
    });

    it("should revoke sessions and bump tokenVersion", async () => {
      const req = { params: { id: targetUser._id.toString() } };
      const res = mockResponse();

      await revokeUserSessions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      
      const user = await User.findById(targetUser._id);
      expect(user.tokenVersion).toBe(1);

      const session = await UserSession.findOne({ userId: targetUser._id });
      expect(session.revokedAt).not.toBeNull();
    });
  });
});
