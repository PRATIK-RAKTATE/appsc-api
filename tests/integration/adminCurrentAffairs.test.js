import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { CurrentAffairs, CURRENT_AFFAIRS_STATUS } from "../../src/modules/current-affairs/models/currentAffairs.model.js";
import { Category } from "../../src/modules/current-affairs/models/category.model.js";
import { User } from "../../src/modules/users/models/user.model.js";
import { scheduleCurrentAffairsRagIngestion } from "../../src/modules/current-affairs/queues/currentAffairsRag.queue.js";
import * as controllers from "../../src/modules/current-affairs/controllers/currentAffairs.controller.js";

vi.mock("../../src/modules/current-affairs/queues/currentAffairsRag.queue.js", () => ({
  scheduleCurrentAffairsRagIngestion: vi.fn(),
}));

let mongoServer;
let adminUser;
let defaultCategory;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  adminUser = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "hashed_password",
    role: "ADMIN",
  });
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
  vi.clearAllMocks();
});

describe("Admin Current Affairs Integration Tests", () => {
  const mockResponse = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    defaultCategory = await Category.create({
      name: "NATIONAL",
      slug: "national",
    });
  });

  const runController = async (controller, reqBody, params = {}, user = { userId: adminUser?._id || "admin-id" }) => {
    const req = {
      body: reqBody,
      params: params,
      user: user,
      query: reqBody.query || {},
    };
    const res = mockResponse();
    await controller(req, res);
    return { res, req };
  };

  describe("Creation & Publishing", () => {
    it("should create a draft article and NOT enqueue RAG job", async () => {
      const body = {
        title: "Draft Article",
        content: "This is a draft content that is long enough to be valid if it were published.",
        category: defaultCategory._id,
        createdBy: adminUser._id,
        status: CURRENT_AFFAIRS_STATUS.DRAFT,
      };

      const { res } = await runController(controllers.createCurrentAffairsController, body);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(scheduleCurrentAffairsRagIngestion).not.toHaveBeenCalled();

      const article = await CurrentAffairs.findOne({ title: "Draft Article" });
      expect(article).toBeDefined();
      expect(article.status).toBe(CURRENT_AFFAIRS_STATUS.DRAFT);
    });

    it("should create a published article and enqueue INDEX job", async () => {
      const body = {
        title: "Published Article",
        content: "This is a published content that is definitely long enough to be valid.",
        category: defaultCategory._id,
        createdBy: adminUser._id,
        status: CURRENT_AFFAIRS_STATUS.PUBLISHED,
      };

      const { res } = await runController(controllers.createCurrentAffairsController, body);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(scheduleCurrentAffairsRagIngestion).toHaveBeenCalled();
    });

    it("should fail to create if required fields are missing", async () => {
      const body = { title: "Missing Content" };
      const { res } = await runController(controllers.createCurrentAffairsController, body);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Updates & Status", () => {
    it("should enqueue INDEX job when a published article is updated", async () => {
      const article = await CurrentAffairs.create({
        title: "Existing Published",
        content: "Initial content that is long enough to be published.",
        category: defaultCategory._id,
        status: CURRENT_AFFAIRS_STATUS.PUBLISHED,
        createdBy: adminUser._id,
      });

      const body = { content: "Updated content that is also long enough to be published." };
      const { res } = await runController(controllers.updateCurrentAffairsController, body, { id: article._id });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(scheduleCurrentAffairsRagIngestion).toHaveBeenCalledWith(article._id, "INDEX");
    });

    it("should enqueue DELETE job when status changes from PUBLISHED to ARCHIVED", async () => {
      const article = await CurrentAffairs.create({
        title: "To be archived",
        content: "Initial content that is long enough to be published.",
        category: defaultCategory._id,
        status: CURRENT_AFFAIRS_STATUS.PUBLISHED,
        createdBy: adminUser._id,
      });

      const body = { status: CURRENT_AFFAIRS_STATUS.ARCHIVED };
      const { res } = await runController(controllers.updateCurrentAffairStatusController, body, { id: article._id });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(scheduleCurrentAffairsRagIngestion).toHaveBeenCalledWith(article._id, "DELETE");
    });

    it("should reject publishing if content is too short (< 50 chars)", async () => {
      const article = await CurrentAffairs.create({
        title: "Short Article",
        content: "Too short",
        category: defaultCategory._id,
        status: CURRENT_AFFAIRS_STATUS.DRAFT,
        createdBy: adminUser._id,
      });

      const body = { status: CURRENT_AFFAIRS_STATUS.PUBLISHED };
      const { res } = await runController(controllers.updateCurrentAffairStatusController, body, { id: article._id });

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Content must be at least 50 characters to publish"
      }));
    });
  });

  describe("Filtering & Pagination", () => {
    beforeEach(async () => {
      await CurrentAffairs.insertMany([
        { title: "Article 1", content: "Content 1...", category: defaultCategory._id, status: "PUBLISHED", createdBy: adminUser._id },
        { title: "Article 2", content: "Content 2...", category: defaultCategory._id, status: "PUBLISHED", createdBy: adminUser._id },
        { title: "Article 3", content: "Content 3...", category: defaultCategory._id, status: "PUBLISHED", createdBy: adminUser._id },
        { title: "Article 4", content: "Content 4...", category: defaultCategory._id, status: "DRAFT", createdBy: adminUser._id },
      ]);
    });

    it("should filter by category", async () => {
      const req = {
        query: { category: defaultCategory._id },
        body: {},
        user: { userId: adminUser._id },
      };
      const res = mockResponse();
      await controllers.getCurrentAffairsController(req, res);

      const resData = res.json.mock.calls[0][0];
      expect(resData.data.length).toBe(4); // All are in defaultCategory
    });

    it("should filter by status", async () => {
      const req = {
        query: { status: "PUBLISHED" },
        body: {},
        user: { userId: adminUser._id },
      };
      const res = mockResponse();
      await controllers.getCurrentAffairsController(req, res);

      const resData = res.json.mock.calls[0][0];
      expect(resData.data.length).toBe(3); // A1, A2, A3
    });

    it("should handle pagination correctly", async () => {
      const req = {
        query: { page: 1, limit: 2 },
        body: {},
        user: { userId: adminUser._id },
      };
      const res = mockResponse();
      await controllers.getCurrentAffairsController(req, res);

      const resData = res.json.mock.calls[0][0];
      expect(resData.data.length).toBe(2);
      expect(resData.pagination.total).toBe(4);
    });
  });
});
