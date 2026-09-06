import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { Subject }  from "../models/subject.model.js";

describe("Subject Schema", () => {
  it("should create a valid subject", () => {
    const subject = new Subject({
      subjectName: "Indian Polity",
      subjectKey: "polity",
    });

    const error = subject.validateSync();

    expect(error).toBeUndefined();
  });

  it("should require subjectName", () => {
    const subject = new Subject({
      subjectKey: "polity",
    });

    const error = subject.validateSync();

    expect(error.errors.subjectName).toBeDefined();
  });

  it("should require subjectKey", () => {
    const subject = new Subject({
      subjectName: "Indian Polity",
    });

    const error = subject.validateSync();

    expect(error.errors.subjectKey).toBeDefined();
  });

  it("should convert subjectKey to lowercase", () => {
    const subject = new Subject({
      subjectName: "Indian Polity",
      subjectKey: "POLITY",
    });

    expect(subject.subjectKey).toBe("polity");
  });

  it("should trim subjectName and subjectKey", () => {
    const subject = new Subject({
      subjectName: "  Indian Polity  ",
      subjectKey: "  POLITY  ",
    });

    expect(subject.subjectName).toBe("Indian Polity");
    expect(subject.subjectKey).toBe("polity");
  });

  it("should set isActive to true by default", () => {
    const subject = new Subject({
      subjectName: "Indian Polity",
      subjectKey: "polity",
    });

    expect(subject.isActive).toBe(true);
  });

  it("should allow isActive to be false", () => {
    const subject = new Subject({
      subjectName: "Indian Polity",
      subjectKey: "polity",
      isActive: false,
    });

    expect(subject.isActive).toBe(false);
  });

 it("should have createdAt and updatedAt timestamp fields", () => {
   expect(Subject.schema.path("createdAt")).toBeDefined();
   expect(Subject.schema.path("updatedAt")).toBeDefined();
 });

  it("should have subjectKey as a unique index", () => {
    const indexes = Subject.schema.indexes();

    const subjectKeyIndex = indexes.find(([fields]) => fields.subjectKey === 1);

    expect(subjectKeyIndex).toBeDefined();
    expect(subjectKeyIndex[1].unique).toBe(true);
  });

  it("should use the Subject model", () => {
    expect(Subject.modelName).toBe("Subject");
  });
});
