import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createQuestionMock,
  getQuestionsMock,
  getQuestionByIdMock,
  updateQuestionMock,
  deleteQuestionMock,
} = vi.hoisted(() => ({
  createQuestionMock: vi.fn(),
  getQuestionsMock: vi.fn(),
  getQuestionByIdMock: vi.fn(),
  updateQuestionMock: vi.fn(),
  deleteQuestionMock: vi.fn(),
}));

vi.mock("../services/question.service.js", () => ({
  createQuestion: createQuestionMock,
  getQuestions: getQuestionsMock,
  getQuestionById: getQuestionByIdMock,
  updateQuestion: updateQuestionMock,
  deleteQuestion: deleteQuestionMock,
}));

import {
  createQuestionController,
  getQuestionsController,
  getQuestionByIdController,
  updateQuestionController,
  deleteQuestionController,
} from "../controllers/question.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const validQuestion = {
  subjectID: "subject-id",
  topicID: "topic-id",
  subTopic: "subtopic-id",
  question: {
    en: "What is the constitution?",
    te: "రాజ్యాంగం అంటే ఏమిటి?",
  },
  option: [
    { key: "A", text: { en: "Option A", te: "ఎంపిక A" }, weight: 1 },
    { key: "B", text: { en: "Option B", te: "ఎంపిక B" }, weight: 0 },
    { key: "C", text: { en: "Option C", te: "ఎంపిక C" }, weight: 0 },
    { key: "D", text: { en: "Option D", te: "ఎంపిక D" }, weight: 0 },
  ],
  explaination: {
    en: "The constitution is the fundamental law.",
    te: "రాజ్యాంగం ప్రాథమిక చట్టం.",
  },
};

describe("Question controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createQuestionController", () => {
    it("creates a question with the complete payload", async () => {
      const createdQuestion = { _id: "question-id", ...validQuestion };
      const res = createResponse();
      createQuestionMock.mockResolvedValue(createdQuestion);

      await createQuestionController({ body: validQuestion }, res);

      expect(createQuestionMock).toHaveBeenCalledWith(validQuestion);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Question created successfully",
        data: createdQuestion,
      });
    });

    it.each([
      ["subjectID", { subjectID: "" }],
      ["topicID", { topicID: null }],
      ["subTopic", { subTopic: undefined }],
      ["question", { question: false }],
      ["option", { option: null }],
      ["explaination", { explaination: 0 }],
    ])("rejects a falsey %s value before calling the service", async (_field, replacement) => {
      const res = createResponse();

      await createQuestionController(
        { body: { ...validQuestion, ...replacement } },
        res
      );

      expect(createQuestionMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "subjectID, topicID, subTopic, question, option and explaination are required",
      });
    });

    it.each([
      "Subject not found",
      "Topic not found",
      "SubTopic not found",
      "Topic does not belong to subject",
      "SubTopic does not belong to topic",
    ])("returns 404 for relationship error: %s", async (message) => {
      const res = createResponse();
      createQuestionMock.mockRejectedValue(new Error(message));

      await createQuestionController({ body: validQuestion }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });

    it("returns 500 for invalid question data rejected by the service", async () => {
      const res = createResponse();
      createQuestionMock.mockRejectedValue(
        new Error("A question must have exactly 4 options")
      );

      await createQuestionController(
        {
          body: {
            ...validQuestion,
            option: validQuestion.option.slice(0, 3),
          },
        },
        res
      );

      expect(createQuestionMock).toHaveBeenCalledWith({
        ...validQuestion,
        option: validQuestion.option.slice(0, 3),
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "A question must have exactly 4 options",
      });
    });
  });

  describe("getQuestionsController", () => {
    it("passes all supported filters to the service", async () => {
      const filters = {
        subjectID: "subject-id",
        topicID: "topic-id",
        subTopic: "subtopic-id",
      };
      const questions = [{ _id: "question-id" }];
      const res = createResponse();
      getQuestionsMock.mockResolvedValue(questions);

      await getQuestionsController({ query: filters }, res);

      expect(getQuestionsMock).toHaveBeenCalledWith(filters);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: questions,
      });
    });

    it("does not alter unexpected query data", async () => {
      const query = {
        subjectID: "wrong-id",
        unexpectedFilter: "should-not-be-dropped-by-controller",
      };
      const res = createResponse();
      getQuestionsMock.mockResolvedValue([]);

      await getQuestionsController({ query }, res);

      expect(getQuestionsMock).toHaveBeenCalledWith(query);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 500 when fetching questions fails", async () => {
      const res = createResponse();
      getQuestionsMock.mockRejectedValue(new Error("Invalid filter"));

      await getQuestionsController({ query: {} }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid filter",
      });
    });
  });

  describe("getQuestionByIdController", () => {
    it("returns a question by id", async () => {
      const question = { _id: "question-id", ...validQuestion };
      const res = createResponse();
      getQuestionByIdMock.mockResolvedValue(question);

      await getQuestionByIdController({ params: { id: "question-id" } }, res);

      expect(getQuestionByIdMock).toHaveBeenCalledWith("question-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: question,
      });
    });

    it.each(["Question not found", "Cast to ObjectId failed"])(
      "returns the correct error response for %s",
      async (message) => {
        const res = createResponse();
        getQuestionByIdMock.mockRejectedValue(new Error(message));

        await getQuestionByIdController(
          { params: { id: "not-a-valid-id" } },
          res
        );

        expect(res.status).toHaveBeenCalledWith(
          message === "Question not found" ? 404 : 500
        );
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message,
        });
      }
    );
  });

  describe("updateQuestionController", () => {
    it("updates a question with the supplied data", async () => {
      const updates = {
        question: {
          en: "Updated question",
          te: "నవీకరించిన ప్రశ్న",
        },
      };
      const question = { _id: "question-id", ...updates };
      const res = createResponse();
      updateQuestionMock.mockResolvedValue(question);

      await updateQuestionController(
        { params: { id: "question-id" }, body: updates },
        res
      );

      expect(updateQuestionMock).toHaveBeenCalledWith("question-id", updates);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Question updated successfully",
        data: question,
      });
    });

    it("returns 404 when updating a missing question", async () => {
      const res = createResponse();
      updateQuestionMock.mockRejectedValue(new Error("Question not found"));

      await updateQuestionController(
        { params: { id: "missing-id" }, body: { option: [] } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Question not found",
      });
    });

    it("returns 500 for invalid update data", async () => {
      const res = createResponse();
      updateQuestionMock.mockRejectedValue(new Error("Validation failed"));

      await updateQuestionController(
        { params: { id: "question-id" }, body: { option: ["wrong"] } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
      });
    });
  });

  describe("deleteQuestionController", () => {
    it("deletes a question", async () => {
      const question = { _id: "question-id", ...validQuestion };
      const res = createResponse();
      deleteQuestionMock.mockResolvedValue(question);

      await deleteQuestionController({ params: { id: "question-id" } }, res);

      expect(deleteQuestionMock).toHaveBeenCalledWith("question-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Question deleted successfully",
        data: question,
      });
    });

    it("returns 404 when deleting a missing question", async () => {
      const res = createResponse();
      deleteQuestionMock.mockRejectedValue(new Error("Question not found"));

      await deleteQuestionController({ params: { id: "missing-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Question not found",
      });
    });

    it("returns 500 when deletion fails unexpectedly", async () => {
      const res = createResponse();
      deleteQuestionMock.mockRejectedValue(new Error("Database unavailable"));

      await deleteQuestionController({ params: { id: "question-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database unavailable",
      });
    });
  });
});