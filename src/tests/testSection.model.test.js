import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { TestSection } from "../models/testSection.model.js";

describe("TestSection Schema", () => {
  const validSection = {
    testId: new mongoose.Types.ObjectId(),

    name: "Quantitative Aptitude",

    order: 1,

    questionCount: 20,

    marksPerQuestion: 2,

    negativeMarkingCoefficient: 0.25,

    randomizeQuestions: true,

    randomizeOptions: true,
  };

  it("should create a valid test section", () => {
    const section = new TestSection(validSection);

    const error = section.validateSync();

    expect(error).toBeUndefined();
  });

  it("should require testId", () => {
    const section = new TestSection({
      ...validSection,
      testId: undefined,
    });

    const error = section.validateSync();

    expect(error.errors.testId).toBeDefined();
  });

  it("should require section name", () => {
    const section = new TestSection({
      ...validSection,
      name: undefined,
    });

    const error = section.validateSync();

    expect(error.errors.name).toBeDefined();
  });

  it("should require order", () => {
    const section = new TestSection({
      ...validSection,
      order: undefined,
    });

    const error = section.validateSync();

    expect(error.errors.order).toBeDefined();
  });

  it("should reject zero order", () => {
    const section = new TestSection({
      ...validSection,
      order: 0,
    });

    const error = section.validateSync();

    expect(error.errors.order).toBeDefined();
  });

  it("should require question count", () => {
    const section = new TestSection({
      ...validSection,
      questionCount: undefined,
    });

    const error = section.validateSync();

    expect(error.errors.questionCount).toBeDefined();
  });

  it("should reject zero question count", () => {
    const section = new TestSection({
      ...validSection,
      questionCount: 0,
    });

    const error = section.validateSync();

    expect(error.errors.questionCount).toBeDefined();
  });

  it("should require marks per question", () => {
    const section = new TestSection({
      ...validSection,
      marksPerQuestion: undefined,
    });

    const error = section.validateSync();

    expect(error.errors.marksPerQuestion).toBeDefined();
  });

  it("should reject negative marking coefficient below zero", () => {
    const section = new TestSection({
      ...validSection,
      negativeMarkingCoefficient: -0.25,
    });

    const error = section.validateSync();

    expect(
      error.errors.negativeMarkingCoefficient
    ).toBeDefined();
  });

  it("should support question randomization", () => {
    const section = new TestSection({
      ...validSection,
      randomizeQuestions: true,
    });

    expect(section.validateSync()).toBeUndefined();
  });

  it("should support option randomization", () => {
    const section = new TestSection({
      ...validSection,
      randomizeOptions: true,
    });

    expect(section.validateSync()).toBeUndefined();
  });
});