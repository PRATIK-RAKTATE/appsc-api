import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSubjectMock,
  getSubjectsMock,
  getSubjectByIdMock,
  updateSubjectMock,
  deleteSubjectMock,
} = vi.hoisted(() => ({
  createSubjectMock: vi.fn(),
  getSubjectsMock: vi.fn(),
  getSubjectByIdMock: vi.fn(),
  updateSubjectMock: vi.fn(),
  deleteSubjectMock: vi.fn(),
}));

vi.mock("../services/subject.service.js", () => ({
  createSubject: createSubjectMock,
  getSubjects: getSubjectsMock,
  getSubjectById: getSubjectByIdMock,
  updateSubject: updateSubjectMock,
  deleteSubject: deleteSubjectMock,
}));

import {
  createSubjectController,
  getSubjectsController,
  getSubjectByIdController,
  updateSubjectController,
  deleteSubjectController,
} from "../controllers/subject.controller.js";

const createResponse = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe("Subject controllers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSubjectController", () => {
    it("creates a subject", async () => {
      const subject = {
        _id: "subject-id",
        subjectName: "Indian Polity",
        subjectKey: "polity",
      };
      const req = {
        body: { subjectName: "Indian Polity", subjectKey: "polity" },
      };
      const res = createResponse();
      createSubjectMock.mockResolvedValue(subject);

      await createSubjectController(req, res);

      expect(createSubjectMock).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Subject created successfully",
        data: subject,
      });
    });

    it("rejects a request with missing required fields", async () => {
      const res = createResponse();

      await createSubjectController({ body: { subjectName: "Polity" } }, res);

      expect(createSubjectMock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "subjectNmae adn subjectKey are required",
      });
    });

    it("returns 500 when subject creation fails", async () => {
      const res = createResponse();
      createSubjectMock.mockRejectedValue(new Error("Database error"));

      await createSubjectController(
        { body: { subjectName: "Polity", subjectKey: "polity" } },
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("getSubjectsController", () => {
    it("returns all subjects", async () => {
      const subjects = [{ _id: "subject-id", subjectName: "Polity" }];
      const res = createResponse();
      getSubjectsMock.mockResolvedValue(subjects);

      await getSubjectsController({}, res);

      expect(getSubjectsMock).toHaveBeenCalledOnce();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: subjects,
      });
    });

    it("returns 500 when fetching subjects fails", async () => {
      const res = createResponse();
      getSubjectsMock.mockRejectedValue(new Error("Database error"));

      await getSubjectsController({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("getSubjectByIdController", () => {
    it("returns a subject by id", async () => {
      const subject = { _id: "subject-id", subjectName: "Polity" };
      const req = { params: { id: "subject-id" } };
      const res = createResponse();
      getSubjectByIdMock.mockResolvedValue(subject);

      await getSubjectByIdController(req, res);

      expect(getSubjectByIdMock).toHaveBeenCalledWith("subject-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: subject,
      });
    });

    it("returns 404 when the subject does not exist", async () => {
      const res = createResponse();
      getSubjectByIdMock.mockRejectedValue(new Error("Subject not found"));

      await getSubjectByIdController({ params: { id: "missing-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Subject not found",
      });
    });
  });

  describe("updateSubjectController", () => {
    it("updates a subject", async () => {
      const req = {
        params: { id: "subject-id" },
        body: { subjectName: "Updated Polity" },
      };
      const subject = { _id: "subject-id", subjectName: "Updated Polity" };
      const res = createResponse();
      updateSubjectMock.mockResolvedValue(subject);

      await updateSubjectController(req, res);

      expect(updateSubjectMock).toHaveBeenCalledWith(req.params.id, req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Subject updated successfully",
        data: subject,
      });
    });

    it("returns 404 when the subject to update does not exist", async () => {
      const res = createResponse();
      updateSubjectMock.mockRejectedValue(new Error("Subject not found"));

      await updateSubjectController(
        { params: { id: "missing-id" }, body: {} },
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Subject not found",
      });
    });
  });

  describe("deleteSubjectController", () => {
    it("deactivates a subject", async () => {
      const subject = {
        _id: "subject-id",
        subjectName: "Polity",
        isActive: false,
      };
      const res = createResponse();
      deleteSubjectMock.mockResolvedValue(subject);

      await deleteSubjectController({ params: { id: "subject-id" } }, res);

      expect(deleteSubjectMock).toHaveBeenCalledWith("subject-id");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Subject deactivated successfully",
        data: subject,
      });
    });

    it("returns 404 when the subject to delete does not exist", async () => {
      const res = createResponse();
      deleteSubjectMock.mockRejectedValue(new Error("Subject not found"));

      await deleteSubjectController({ params: { id: "missing-id" } }, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Subject not found",
      });
    });
  });
});