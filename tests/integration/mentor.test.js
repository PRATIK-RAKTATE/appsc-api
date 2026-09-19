import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { User, USER_ROLES } from "../../src/models/user.model.js";
import { MentorProfile, MENTOR_STATUS } from "../../src/models/mentorProfile.model.js";
import { StudentMentorThread, MENTOR_THREAD_STATUS } from "../../src/models/studentMentorThread.model.js";

import * as mentorController from "../../src/controllers/mentor.controller.js";
import * as adminMentorController from "../../src/controllers/adminMentor.controller.js";

// ──────────────────────────────────────────────────────────────
// Test infrastructure
// ──────────────────────────────────────────────────────────────

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Wipe every collection between tests so they remain independent.
  for (const key of Object.keys(mongoose.connection.collections)) {
    await mongoose.connection.collections[key].deleteMany({});
  }
});

/** Minimal mock of Express res object. */
const mockResponse = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

/**
 * Call a controller function with mock req/res and return the result.
 * @param {Function} controller
 * @param {{ body?, params?, query?, user? }} overrides
 */
const callController = async (controller, { body = {}, params = {}, query = {}, user } = {}) => {
  const req = { body, params, query, user };
  const res = mockResponse();
  await controller(req, res);
  const statusCode = res.status.mock.calls[0]?.[0];
  const responseBody = res.json.mock.calls[0]?.[0];
  return { req, res, statusCode, body: responseBody };
};

// Need to import vi from vitest for the mock helpers above.
import { vi } from "vitest";

// ──────────────────────────────────────────────────────────────
// Shared fixtures
// ──────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) =>
  User.create({
    name: overrides.name || "Test User",
    email: overrides.email || `user-${Date.now()}-${Math.random()}@test.com`,
    role: overrides.role || USER_ROLES.STUDENT,
    isVerified: true,
    ...overrides,
  });

const validApplication = {
  bio: "Experienced mentor for APPSC aspirants with 5+ years of guidance.",
  expertise: ["POLITY", "ECONOMY"],
  languages: ["ENGLISH", "TELUGU"],
  qualifications: ["MA Political Science", "B.Ed"],
  experienceYears: 5,
};

// ──────────────────────────────────────────────────────────────
// 1. Mentor Application (POST /api/mentors/apply)
// ──────────────────────────────────────────────────────────────

describe("Mentor Application – applyForMentor", () => {
  it("should create a new mentor profile with PENDING status", async () => {
    const user = await makeUser();
    const { statusCode, body } = await callController(mentorController.applyForMentor, {
      body: validApplication,
      user: { userId: user._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(MENTOR_STATUS.PENDING);
    expect(body.data.bio).toBe(validApplication.bio);
    expect(body.data.expertise).toEqual(expect.arrayContaining(["POLITY", "ECONOMY"]));
  });

  it("should upsert (re-apply) if application was previously REJECTED", async () => {
    const user = await makeUser();
    // First apply
    await callController(mentorController.applyForMentor, {
      body: validApplication,
      user: { userId: user._id.toString() },
    });
    // Admin rejects it
    const profile = await MentorProfile.findOne({ userId: user._id });
    profile.status = MENTOR_STATUS.REJECTED;
    profile.rejectionReason = "Not enough experience";
    await profile.save();

    // Re-apply
    const { statusCode, body } = await callController(mentorController.applyForMentor, {
      body: { ...validApplication, bio: "Updated bio with more detail." },
      user: { userId: user._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(MENTOR_STATUS.PENDING);
    expect(body.data.bio).toBe("Updated bio with more detail.");
  });

  it("should prevent re-application if already APPROVED", async () => {
    const user = await makeUser();
    await MentorProfile.create({
      userId: user._id,
      ...validApplication,
      status: MENTOR_STATUS.APPROVED,
      approvedAt: new Date(),
    });

    const { statusCode, body } = await callController(mentorController.applyForMentor, {
      body: validApplication,
      user: { userId: user._id.toString() },
    });

    expect(statusCode).toBe(409);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/already been approved/i);
  });

  it("should reject a request missing bio", async () => {
    const user = await makeUser();
    const { statusCode, body } = await callController(mentorController.applyForMentor, {
      body: { ...validApplication, bio: undefined },
      user: { userId: user._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/bio/i);
  });

  it("should reject a request with an empty expertise array", async () => {
    const user = await makeUser();
    const { statusCode, body } = await callController(mentorController.applyForMentor, {
      body: { ...validApplication, expertise: [] },
      user: { userId: user._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/expertise/i);
  });

  it("should reject a request with an empty languages array", async () => {
    const user = await makeUser();
    const { statusCode, body } = await callController(mentorController.applyForMentor, {
      body: { ...validApplication, languages: [] },
      user: { userId: user._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/languages/i);
  });
});

// ──────────────────────────────────────────────────────────────
// 2. Admin approval / rejection (PATCH /api/admin/mentors/:id/status)
// ──────────────────────────────────────────────────────────────

describe("Admin Mentor Status – updateMentorStatus", () => {
  let adminUser;

  beforeEach(async () => {
    adminUser = await makeUser({ name: "Admin", email: "admin@test.com", role: USER_ROLES.ADMIN });
  });

  it("should approve a PENDING mentor and promote User role to MENTOR", async () => {
    const applicantUser = await makeUser({ name: "Applicant" });
    const profile = await MentorProfile.create({
      userId: applicantUser._id,
      ...validApplication,
      status: MENTOR_STATUS.PENDING,
    });

    const { statusCode, body } = await callController(adminMentorController.updateMentorStatus, {
      params: { id: profile._id.toString() },
      body: { status: MENTOR_STATUS.APPROVED },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(MENTOR_STATUS.APPROVED);
    expect(body.data.approvedAt).toBeTruthy();

    // User role should be promoted
    const updatedUser = await User.findById(applicantUser._id);
    expect(updatedUser.role).toBe(USER_ROLES.MENTOR);
  });

  it("should reject a PENDING mentor with a rejection reason", async () => {
    const applicantUser = await makeUser({ name: "Applicant2", email: "app2@test.com" });
    const profile = await MentorProfile.create({
      userId: applicantUser._id,
      ...validApplication,
      status: MENTOR_STATUS.PENDING,
    });

    const { statusCode, body } = await callController(adminMentorController.updateMentorStatus, {
      params: { id: profile._id.toString() },
      body: { status: MENTOR_STATUS.REJECTED, rejectionReason: "Insufficient qualifications" },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe(MENTOR_STATUS.REJECTED);
    expect(body.data.rejectionReason).toBe("Insufficient qualifications");
    // approvedAt and approvedBy should be cleared
    expect(body.data.approvedAt).toBeNull();
    expect(body.data.approvedBy).toBeNull();

    // User role should NOT be promoted
    const notUpdatedUser = await User.findById(applicantUser._id);
    expect(notUpdatedUser.role).toBe(USER_ROLES.STUDENT);
  });

  it("should require rejectionReason when status is REJECTED", async () => {
    const applicantUser = await makeUser({ name: "Applicant3", email: "app3@test.com" });
    const profile = await MentorProfile.create({
      userId: applicantUser._id,
      ...validApplication,
      status: MENTOR_STATUS.PENDING,
    });

    const { statusCode, body } = await callController(adminMentorController.updateMentorStatus, {
      params: { id: profile._id.toString() },
      body: { status: MENTOR_STATUS.REJECTED }, // missing rejectionReason
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/rejectionReason/i);
  });

  it("should return 404 for a non-existent profile", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { statusCode, body } = await callController(adminMentorController.updateMentorStatus, {
      params: { id: fakeId },
      body: { status: MENTOR_STATUS.APPROVED },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(404);
    expect(body.success).toBe(false);
  });

  it("should return 400 for an invalid profile ID", async () => {
    const { statusCode, body } = await callController(adminMentorController.updateMentorStatus, {
      params: { id: "not-a-valid-id" },
      body: { status: MENTOR_STATUS.APPROVED },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
  });

  it("should return 400 for an invalid status value", async () => {
    const applicantUser = await makeUser({ name: "Applicant4", email: "app4@test.com" });
    const profile = await MentorProfile.create({
      userId: applicantUser._id,
      ...validApplication,
      status: MENTOR_STATUS.PENDING,
    });

    const { statusCode, body } = await callController(adminMentorController.updateMentorStatus, {
      params: { id: profile._id.toString() },
      body: { status: "PENDING" }, // PENDING is not a valid transition target
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// 3. Browse Mentors (GET /api/mentors)
// ──────────────────────────────────────────────────────────────

describe("Browse Mentors – browseMentors", () => {
  let approvedUser1, approvedUser2, pendingUser, rejectedUser;
  let approvedProfile1, approvedProfile2;

  beforeEach(async () => {
    approvedUser1 = await makeUser({ name: "Alice Mentor", email: "alice@test.com" });
    approvedUser2 = await makeUser({ name: "Bob Mentor", email: "bob@test.com" });
    pendingUser = await makeUser({ name: "Pending Person", email: "pending@test.com" });
    rejectedUser = await makeUser({ name: "Rejected Person", email: "rejected@test.com" });

    approvedProfile1 = await MentorProfile.create({
      userId: approvedUser1._id,
      bio: "Polity and Economy expert.",
      expertise: ["POLITY", "ECONOMY"],
      languages: ["ENGLISH"],
      status: MENTOR_STATUS.APPROVED,
      approvedAt: new Date(),
    });

    approvedProfile2 = await MentorProfile.create({
      userId: approvedUser2._id,
      bio: "History and GS expert.",
      expertise: ["HISTORY", "GENERAL_STUDIES"],
      languages: ["TELUGU"],
      status: MENTOR_STATUS.APPROVED,
      approvedAt: new Date(),
    });

    await MentorProfile.create({
      userId: pendingUser._id,
      bio: "Pending mentor.",
      expertise: ["POLITY"],
      languages: ["ENGLISH"],
      status: MENTOR_STATUS.PENDING,
    });

    await MentorProfile.create({
      userId: rejectedUser._id,
      bio: "Rejected mentor.",
      expertise: ["HISTORY"],
      languages: ["TELUGU"],
      status: MENTOR_STATUS.REJECTED,
      rejectionReason: "Not enough experience",
    });
  });

  it("should return only APPROVED mentors by default", async () => {
    const { statusCode, body } = await callController(mentorController.browseMentors, {
      query: {},
    });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    body.data.forEach((p) => expect(p.status).toBe(MENTOR_STATUS.APPROVED));
  });

  it("should filter by expertise", async () => {
    const { statusCode, body } = await callController(mentorController.browseMentors, {
      query: { expertise: "POLITY" },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].expertise).toContain("POLITY");
  });

  it("should filter by language", async () => {
    const { statusCode, body } = await callController(mentorController.browseMentors, {
      query: { language: "TELUGU" },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].languages).toContain("TELUGU");
  });

  it("should filter by name search", async () => {
    const { statusCode, body } = await callController(mentorController.browseMentors, {
      query: { search: "Alice" },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId.name).toMatch(/alice/i);
  });

  it("should return empty array when search matches no approved mentor", async () => {
    const { statusCode, body } = await callController(mentorController.browseMentors, {
      query: { search: "Pending" }, // pendingUser name matches, but profile not APPROVED
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(0);
  });

  it("should paginate results correctly", async () => {
    const { statusCode, body } = await callController(mentorController.browseMentors, {
      query: { page: 1, limit: 1 },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(2);
    expect(body.pagination.pages).toBe(2);
  });

  it("should populate user name and email on results", async () => {
    const { statusCode, body } = await callController(mentorController.browseMentors, {
      query: {},
    });

    expect(statusCode).toBe(200);
    body.data.forEach((p) => {
      expect(p.userId).toBeDefined();
      expect(p.userId.name).toBeDefined();
      expect(p.userId.email).toBeDefined();
    });
  });
});

// ──────────────────────────────────────────────────────────────
// 4. Connect with Mentor (POST /api/mentors/:id/connect)
// ──────────────────────────────────────────────────────────────

describe("Connect with Mentor – connectWithMentor", () => {
  let studentUser, mentorUser, approvedProfile, pendingProfile;

  beforeEach(async () => {
    studentUser = await makeUser({ name: "Student", email: "student@test.com" });
    mentorUser = await makeUser({ name: "Mentor User", email: "mentor@test.com", role: USER_ROLES.MENTOR });

    approvedProfile = await MentorProfile.create({
      userId: mentorUser._id,
      bio: "APPSC specialist.",
      expertise: ["POLITY"],
      languages: ["ENGLISH"],
      status: MENTOR_STATUS.APPROVED,
      approvedAt: new Date(),
    });

    const anotherUser = await makeUser({ name: "Pending App", email: "pendingapp@test.com" });
    pendingProfile = await MentorProfile.create({
      userId: anotherUser._id,
      bio: "Wants to be mentor.",
      expertise: ["ECONOMY"],
      languages: ["TELUGU"],
      status: MENTOR_STATUS.PENDING,
    });
  });

  it("should create a new thread when student connects to an approved mentor", async () => {
    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: approvedProfile._id.toString() },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toMatch(/created/i);
    expect(body.data.thread).toBeDefined();
    expect(body.data.thread.status).toBe(MENTOR_THREAD_STATUS.ACTIVE);

    // Verify persisted in DB
    const thread = await StudentMentorThread.findOne({
      studentId: studentUser._id,
      mentorId: mentorUser._id,
    });
    expect(thread).not.toBeNull();
  });

  it("should be idempotent — return existing thread on second call", async () => {
    // First connect
    await callController(mentorController.connectWithMentor, {
      params: { id: approvedProfile._id.toString() },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    // Second connect
    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: approvedProfile._id.toString() },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.message).toMatch(/already exists/i);

    // Only one thread should exist in DB
    const count = await StudentMentorThread.countDocuments({
      studentId: studentUser._id,
      mentorId: mentorUser._id,
    });
    expect(count).toBe(1);
  });

  it("should attach pendingMessage in response when initialMessage is provided", async () => {
    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: approvedProfile._id.toString() },
      body: { initialMessage: "Hello, I need guidance for APPSC preparation." },
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(201);
    expect(body.data.pendingMessage).toBe("Hello, I need guidance for APPSC preparation.");
  });

  it("should reject connection to a PENDING mentor", async () => {
    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: pendingProfile._id.toString() },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/not approved/i);
  });

  it("should reject connection to a REJECTED mentor", async () => {
    await MentorProfile.findByIdAndUpdate(pendingProfile._id, {
      status: MENTOR_STATUS.REJECTED,
      rejectionReason: "Unqualified",
    });

    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: pendingProfile._id.toString() },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/not approved/i);
  });

  it("should prevent self-selection (student is the mentor)", async () => {
    // Make the student also have an approved mentor profile
    const selfProfile = await MentorProfile.create({
      userId: studentUser._id,
      bio: "I am a student and also a mentor.",
      expertise: ["POLITY"],
      languages: ["ENGLISH"],
      status: MENTOR_STATUS.APPROVED,
      approvedAt: new Date(),
    });

    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: selfProfile._id.toString() },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/yourself/i);
  });

  it("should return 404 for a non-existent mentor profile", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: fakeId },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(404);
    expect(body.success).toBe(false);
  });

  it("should return 400 for an invalid mentor profile ID", async () => {
    const { statusCode, body } = await callController(mentorController.connectWithMentor, {
      params: { id: "bad-id" },
      body: {},
      user: { userId: studentUser._id.toString() },
    });

    expect(statusCode).toBe(400);
    expect(body.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────
// 5. Admin: list applications (GET /api/admin/mentors)
// ──────────────────────────────────────────────────────────────

describe("Admin List Applications – listMentorApplications", () => {
  let adminUser;

  beforeEach(async () => {
    adminUser = await makeUser({ name: "Admin", email: "admin2@test.com", role: USER_ROLES.ADMIN });

    const u1 = await makeUser({ name: "U1", email: "u1@test.com" });
    const u2 = await makeUser({ name: "U2", email: "u2@test.com" });
    const u3 = await makeUser({ name: "U3", email: "u3@test.com" });

    await MentorProfile.create({ userId: u1._id, bio: "Bio 1", expertise: ["POLITY"], languages: ["ENGLISH"], status: MENTOR_STATUS.PENDING });
    await MentorProfile.create({ userId: u2._id, bio: "Bio 2", expertise: ["ECONOMY"], languages: ["TELUGU"], status: MENTOR_STATUS.APPROVED, approvedAt: new Date() });
    await MentorProfile.create({ userId: u3._id, bio: "Bio 3", expertise: ["HISTORY"], languages: ["ENGLISH"], status: MENTOR_STATUS.REJECTED, rejectionReason: "Reason" });
  });

  it("should return all applications with no status filter", async () => {
    const { statusCode, body } = await callController(adminMentorController.listMentorApplications, {
      query: {},
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    expect(body.pagination.total).toBe(3);
  });

  it("should filter by PENDING status", async () => {
    const { statusCode, body } = await callController(adminMentorController.listMentorApplications, {
      query: { status: MENTOR_STATUS.PENDING },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe(MENTOR_STATUS.PENDING);
  });

  it("should filter by APPROVED status", async () => {
    const { statusCode, body } = await callController(adminMentorController.listMentorApplications, {
      query: { status: MENTOR_STATUS.APPROVED },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe(MENTOR_STATUS.APPROVED);
  });

  it("should filter by REJECTED status", async () => {
    const { statusCode, body } = await callController(adminMentorController.listMentorApplications, {
      query: { status: MENTOR_STATUS.REJECTED },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].status).toBe(MENTOR_STATUS.REJECTED);
  });

  it("should paginate results correctly", async () => {
    const { statusCode, body } = await callController(adminMentorController.listMentorApplications, {
      query: { page: 1, limit: 2 },
      user: { userId: adminUser._id.toString() },
    });

    expect(statusCode).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
    expect(body.pagination.pages).toBe(2);
  });
});
