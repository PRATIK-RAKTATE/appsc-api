import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createTopicMock,
  getTopicsMock,
  getTopicByIdMock,
  updateTopicMock,
  deleteTopicMock,
} = vi.hoisted(() => ({
  createTopicMock: vi.fn(),
  getTopicsMock: vi.fn(),
  getTopicByIdMock: vi.fn(),
  updateTopicMock: vi.fn(),
  deleteTopicMock: vi.fn(),
}));

vi.mock("../services/topic.service.js", () => ({
  createTopic: createTopicMock,
  getTopics: getTopicsMock,
  getTopicById: getTopicByIdMock,
  updateTopic: updateTopicMock,
  deleteTopic: deleteTopicMock,
}));

import {
  createTopicController,
  getTopicsController,
  getTopicByIdController,
  updateTopicController,
  deleteTopicController,
} from "../controllers/topic.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("Topic controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTopicController", () => {
    it("creates a topic", async () => {
      const req = {
        body: {
          subjectID: "subject-id",
          topicName: "Fundamental Rights",
          topicKey: "fundamental-rights",
        },
      };
      const topic = { _id: "topic-id", ...req.body };
      const res = createResponse();
      createTopicMock.mockResolvedValue(topic);

      await createTopicController(req, res);

      expect(createTopicMock).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "topic created successfully",
        data: topic,
      });
    });

    it("rejects a request with missing required fields", async () => {
      const res = createResponse();

      await createTopicController(
        { body: { subjectID: "subject-id", topicName: "Rights" } },
        res
      );

      expect(createTopicMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "subjectId , topicName and topicKey are required",
      });
    });

    it("returns 404 when the subject does not exist", async () => {
      const res = createResponse();
      createTopicMock.mockRejectedValue(new Error("Subject not found"));

      await createTopicController(
        {
          body: {
            subjectID: "missing-subject",
            topicName: "Rights",
            topicKey: "rights",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Subject not found",
      });
    });

    it("returns 500 when topic creation fails", async () => {
      const res = createResponse();
      createTopicMock.mockRejectedValue(new Error("Database error"));

      await createTopicController(
        {
          body: {
            subjectID: "subject-id",
            topicName: "Rights",
            topicKey: "rights",
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

  describe("getTopicsController", () => {
    it("returns topics filtered by subject id", async () => {
      const topics = [{ _id: "topic-id", topicName: "Rights" }];
      const res = createResponse();
      getTopicsMock.mockResolvedValue(topics);

      await getTopicsController({ query: { subjectID: "subject-id" } }, res);

      expect(getTopicsMock).toHaveBeenCalledWith("subject-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: topics,
      });
    });

    it("returns all topics when no subject filter is provided", async () => {
      const res = createResponse();
      getTopicsMock.mockResolvedValue([]);

      await getTopicsController({ query: {} }, res);

      expect(getTopicsMock).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it("returns 500 when fetching topics fails", async () => {
      const res = createResponse();
      getTopicsMock.mockRejectedValue(new Error("Database error"));

      await getTopicsController({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("getTopicByIdController", () => {
    it("returns a topic by id", async () => {
      const topic = { _id: "topic-id", topicName: "Rights" };
      const res = createResponse();
      getTopicByIdMock.mockResolvedValue(topic);

      await getTopicByIdController({ params: { id: "topic-id" } }, res);

      expect(getTopicByIdMock).toHaveBeenCalledWith("topic-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: topic,
      });
    });

    it("returns 404 when the topic does not exist", async () => {
      const res = createResponse();
      getTopicByIdMock.mockRejectedValue(new Error("Topic not found"));

      await getTopicByIdController({ params: { id: "missing-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Topic not found",
      });
    });
  });

  describe("updateTopicController", () => {
    it("updates a topic", async () => {
      const req = {
        params: { id: "topic-id" },
        body: { topicName: "Updated Rights" },
      };
      const topic = { _id: "topic-id", topicName: "Updated Rights" };
      const res = createResponse();
      updateTopicMock.mockResolvedValue(topic);

      await updateTopicController(req, res);

      expect(updateTopicMock).toHaveBeenCalledWith(req.params.id, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Topic updated successfully",
        data: topic,
      });
    });

    it("returns 404 when the topic to update does not exist", async () => {
      const res = createResponse();
      updateTopicMock.mockRejectedValue(new Error("Topic not found"));

      await updateTopicController(
        { params: { id: "missing-id" }, body: {} },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Topic not found",
      });
    });
  });

  describe("deleteTopicController", () => {
    it("deactivates a topic", async () => {
      const topic = {
        _id: "topic-id",
        topicName: "Rights",
        isActive: false,
      };
      const res = createResponse();
      deleteTopicMock.mockResolvedValue(topic);

      await deleteTopicController({ params: { id: "topic-id" } }, res);

      expect(deleteTopicMock).toHaveBeenCalledWith("topic-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Topic deactivated successfully",
        data: topic,
      });
    });

    it("returns 404 when the topic to delete does not exist", async () => {
      const res = createResponse();
      deleteTopicMock.mockRejectedValue(new Error("Topic not found"));

      await deleteTopicController({ params: { id: "missing-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Topic not found",
      });
    });
  });
});