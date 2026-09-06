import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSubTopicMock,
  getSubTopicsMock,
  getSubTopicByIdMock,
  updateSubTopicMock,
  deleteSubTopicMock,
} = vi.hoisted(() => ({
  createSubTopicMock: vi.fn(),
  getSubTopicsMock: vi.fn(),
  getSubTopicByIdMock: vi.fn(),
  updateSubTopicMock: vi.fn(),
  deleteSubTopicMock: vi.fn(),
}));

vi.mock("../services/subTopic.service.js", () => ({
  createSubTopic: createSubTopicMock,
  getSubTopics: getSubTopicsMock,
  getSubTopicById: getSubTopicByIdMock,
  updateSubTopic: updateSubTopicMock,
  deleteSubTopic: deleteSubTopicMock,
}));

import {
  createSubTopicController,
  getSubTopicsController,
  getSubTopicByIdController,
  updateSubTopicController,
  deleteSubTopicController,
} from "../controllers/subTopic.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("SubTopic controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSubTopicController", () => {
    it("creates a subtopic", async () => {
      const req = {
        body: {
          topicID: "topic-id",
          subTopicName: "Fundamental Rights",
          subTopicKey: "fundamental-rights",
        },
      };
      const subTopic = { _id: "subtopic-id", ...req.body };
      const res = createResponse();
      createSubTopicMock.mockResolvedValue(subTopic);

      await createSubTopicController(req, res);

      expect(createSubTopicMock).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "SubTopic created successfully",
        data: subTopic,
      });
    });

    it("rejects a request with missing required fields", async () => {
      const res = createResponse();

      await createSubTopicController(
        { body: { topicID: "topic-id", subTopicName: "Rights" } },
        res
      );

      expect(createSubTopicMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "topicID, subTopicName and subTopicKey are required",
      });
    });

    it("returns 404 when the topic does not exist", async () => {
      const res = createResponse();
      createSubTopicMock.mockRejectedValue(new Error("Topic not found"));

      await createSubTopicController(
        {
          body: {
            topicID: "missing-topic",
            subTopicName: "Rights",
            subTopicKey: "rights",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Topic not found",
      });
    });

    it("returns 500 when subtopic creation fails", async () => {
      const res = createResponse();
      createSubTopicMock.mockRejectedValue(new Error("Database error"));

      await createSubTopicController(
        {
          body: {
            topicID: "topic-id",
            subTopicName: "Rights",
            subTopicKey: "rights",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("getSubTopicsController", () => {
    it("returns subtopics filtered by topic id", async () => {
      const subTopics = [{ _id: "subtopic-id", subTopicName: "Rights" }];
      const res = createResponse();
      getSubTopicsMock.mockResolvedValue(subTopics);

      await getSubTopicsController({ query: { topicID: "topic-id" } }, res);

      expect(getSubTopicsMock).toHaveBeenCalledWith("topic-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: subTopics,
      });
    });

    it("returns all subtopics when no topic filter is provided", async () => {
      const res = createResponse();
      getSubTopicsMock.mockResolvedValue([]);

      await getSubTopicsController({ query: {} }, res);

      expect(getSubTopicsMock).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it("returns 500 when fetching subtopics fails", async () => {
      const res = createResponse();
      getSubTopicsMock.mockRejectedValue(new Error("Database error"));

      await getSubTopicsController({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("getSubTopicByIdController", () => {
    it("returns a subtopic by id", async () => {
      const subTopic = { _id: "subtopic-id", subTopicName: "Rights" };
      const res = createResponse();
      getSubTopicByIdMock.mockResolvedValue(subTopic);

      await getSubTopicByIdController(
        { params: { id: "subtopic-id" } },
        res
      );

      expect(getSubTopicByIdMock).toHaveBeenCalledWith("subtopic-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: subTopic,
      });
    });

    it("returns 404 when the subtopic does not exist", async () => {
      const res = createResponse();
      getSubTopicByIdMock.mockRejectedValue(new Error("SubTopic not found"));

      await getSubTopicByIdController(
        { params: { id: "missing-id" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "SubTopic not found",
      });
    });
  });

  describe("updateSubTopicController", () => {
    it("updates a subtopic", async () => {
      const req = {
        params: { id: "subtopic-id" },
        body: { subTopicName: "Updated Rights" },
      };
      const subTopic = { _id: "subtopic-id", subTopicName: "Updated Rights" };
      const res = createResponse();
      updateSubTopicMock.mockResolvedValue(subTopic);

      await updateSubTopicController(req, res);

      expect(updateSubTopicMock).toHaveBeenCalledWith(req.params.id, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "SubTopic updated successfully",
        data: subTopic,
      });
    });

    it("returns 404 when the subtopic to update does not exist", async () => {
      const res = createResponse();
      updateSubTopicMock.mockRejectedValue(new Error("SubTopic not found"));

      await updateSubTopicController(
        { params: { id: "missing-id" }, body: {} },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "SubTopic not found",
      });
    });
  });

  describe("deleteSubTopicController", () => {
    it("deactivates a subtopic", async () => {
      const subTopic = {
        _id: "subtopic-id",
        subTopicName: "Rights",
        isActive: false,
      };
      const res = createResponse();
      deleteSubTopicMock.mockResolvedValue(subTopic);

      await deleteSubTopicController(
        { params: { id: "subtopic-id" } },
        res
      );

      expect(deleteSubTopicMock).toHaveBeenCalledWith("subtopic-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "SubTopic deactivated successfully",
        data: subTopic,
      });
    });

    it("returns 404 when the subtopic to delete does not exist", async () => {
      const res = createResponse();
      deleteSubTopicMock.mockRejectedValue(new Error("SubTopic not found"));

      await deleteSubTopicController(
        { params: { id: "missing-id" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "SubTopic not found",
      });
    });
  });
});