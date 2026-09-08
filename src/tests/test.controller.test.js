import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createTestMock,
  getTestsMock,
  getTestByIdMock,
  updateTestMock,
  deleteTestMock,
} = vi.hoisted(() => ({
  createTestMock: vi.fn(),
  getTestsMock: vi.fn(),
  getTestByIdMock: vi.fn(),
  updateTestMock: vi.fn(),
  deleteTestMock: vi.fn(),
}));

vi.mock("../services/test.service.js", () => ({
  createTest: createTestMock,
  getTests: getTestsMock,
  getTestById: getTestByIdMock,
  updateTest: updateTestMock,
  deleteTest: deleteTestMock,
}));

import {
  createTestController,
  getTestsController,
  getTestByIdController,
  updateTestController,
  deleteTestController,
} from "../controllers/test.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

const testPayload = {
  title: "Constitution Mock Test",
  description: "A practice test",
  type: "MOCK_TEST",
  durationMinutes: 60,
  totalMarks: 100,
  createdBy: "user-id",
};

describe("Test controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTestController", () => {
    it("creates a test with the request body", async () => {
      const createdTest = { _id: "test-id", ...testPayload };
      const res = createResponse();
      createTestMock.mockResolvedValue(createdTest);

      await createTestController({ body: testPayload }, res);

      expect(createTestMock).toHaveBeenCalledWith(testPayload);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Test created successfully",
        data: createdTest,
      });
    });

    it("uses a service status code when creation fails", async () => {
      const res = createResponse();
      const error = new Error("Invalid test data");
      error.statusCode = 400;
      createTestMock.mockRejectedValue(error);

      await createTestController({ body: testPayload }, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid test data",
      });
    });

    it("uses the fallback message for an error without a message", async () => {
      const res = createResponse();
      createTestMock.mockRejectedValue({});

      await createTestController({ body: testPayload }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to create test",
      });
    });
  });

  describe("getTestsController", () => {
    it("returns all tests", async () => {
      const tests = [{ _id: "test-id", title: testPayload.title }];
      const res = createResponse();
      getTestsMock.mockResolvedValue(tests);

      await getTestsController({}, res);

      expect(getTestsMock).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: tests,
      });
    });

    it("returns the service error when fetching tests fails", async () => {
      const res = createResponse();
      getTestsMock.mockRejectedValue(new Error("Database unavailable"));

      await getTestsController({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database unavailable",
      });
    });
  });

  describe("getTestByIdController", () => {
    it("returns a test by id", async () => {
      const test = { _id: "test-id", ...testPayload };
      const res = createResponse();
      getTestByIdMock.mockResolvedValue(test);

      await getTestByIdController({ params: { id: "test-id" } }, res);

      expect(getTestByIdMock).toHaveBeenCalledWith("test-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: test,
      });
    });

    it("returns 404 when the test does not exist", async () => {
      const res = createResponse();
      const error = new Error("Test not found");
      error.statusCode = 404;
      getTestByIdMock.mockRejectedValue(error);

      await getTestByIdController({ params: { id: "missing-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Test not found",
      });
    });
  });

  describe("updateTestController", () => {
    it("updates a test with the request body", async () => {
      const updates = { title: "Updated Mock Test", totalMarks: 120 };
      const updatedTest = { _id: "test-id", ...testPayload, ...updates };
      const res = createResponse();
      updateTestMock.mockResolvedValue(updatedTest);

      await updateTestController(
        { params: { id: "test-id" }, body: updates },
        res
      );

      expect(updateTestMock).toHaveBeenCalledWith("test-id", updates);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Test updated successfully",
        data: updatedTest,
      });
    });

    it("returns 404 when updating a missing test", async () => {
      const res = createResponse();
      const error = new Error("Test not found");
      error.statusCode = 404;
      updateTestMock.mockRejectedValue(error);

      await updateTestController(
        { params: { id: "missing-id" }, body: { title: "Updated" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Test not found",
      });
    });
  });

  describe("deleteTestController", () => {
    it("deletes a test", async () => {
      const res = createResponse();
      deleteTestMock.mockResolvedValue({ _id: "test-id" });

      await deleteTestController({ params: { id: "test-id" } }, res);

      expect(deleteTestMock).toHaveBeenCalledWith("test-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Test deleted successfully",
      });
    });

    it("returns 404 when deleting a missing test", async () => {
      const res = createResponse();
      const error = new Error("Test not found");
      error.statusCode = 404;
      deleteTestMock.mockRejectedValue(error);

      await deleteTestController({ params: { id: "missing-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Test not found",
      });
    });

    it("returns the fallback message for an unexpected deletion error", async () => {
      const res = createResponse();
      deleteTestMock.mockRejectedValue({});

      await deleteTestController({ params: { id: "test-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Failed to delete test",
      });
    });
  });
});