import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  Test,
  TEST_TYPES,
  SCHEDULE_MODES,
} from "../models/test.model.js";

describe("Test Schema", () => {
  const userId = new mongoose.Types.ObjectId();

  const validTest = {
    title: "UPSC Mock Test 1",
    description: "Full length mock test",
    type: TEST_TYPES.MOCK_TEST,
    durationMinutes: 120,
    totalMarks: 100,
    negativeMarking: {
      enabled: true,
      coefficient: 0.25,
    },
    randomization: {
      questions: true,
      options: true,
    },
    schedule: {
      mode: SCHEDULE_MODES.ON_DEMAND,
    },
    createdBy: userId,
  };

  it("should create a valid test", () => {
    const test = new Test(validTest);
    const error = test.validateSync();

    expect(error).toBeUndefined();
  });

  it("should require title", () => {
    const test = new Test({
      ...validTest,
      title: undefined,
    });

    const error = test.validateSync();

    expect(error.errors.title).toBeDefined();
  });

  it("should require test type", () => {
    const test = new Test({
      ...validTest,
      type: undefined,
    });

    const error = test.validateSync();

    expect(error.errors.type).toBeDefined();
  });

  it("should accept MOCK_TEST", () => {
    const test = new Test({
      ...validTest,
      type: TEST_TYPES.MOCK_TEST,
    });

    expect(test.validateSync()).toBeUndefined();
  });

  it("should accept SECTIONAL_TEST", () => {
    const test = new Test({
      ...validTest,
      type: TEST_TYPES.SECTIONAL_TEST,
    });

    expect(test.validateSync()).toBeUndefined();
  });

  it("should accept QUIZ", () => {
    const test = new Test({
      ...validTest,
      type: TEST_TYPES.QUIZ,
    });

    expect(test.validateSync()).toBeUndefined();
  });

  it("should reject invalid test type", () => {
    const test = new Test({
      ...validTest,
      type: "INVALID",
    });

    const error = test.validateSync();

    expect(error.errors.type).toBeDefined();
  });

  it("should require duration", () => {
    const test = new Test({
      ...validTest,
      durationMinutes: undefined,
    });

    const error = test.validateSync();

    expect(error.errors.durationMinutes).toBeDefined();
  });

  it("should reject zero duration", () => {
    const test = new Test({
      ...validTest,
      durationMinutes: 0,
    });

    const error = test.validateSync();

    expect(error.errors.durationMinutes).toBeDefined();
  });

  it("should require total marks", () => {
    const test = new Test({
      ...validTest,
      totalMarks: undefined,
    });

    const error = test.validateSync();

    expect(error.errors.totalMarks).toBeDefined();
  });

  it("should reject negative total marks", () => {
    const test = new Test({
      ...validTest,
      totalMarks: -10,
    });

    const error = test.validateSync();

    expect(error.errors.totalMarks).toBeDefined();
  });

  it("should support negative marking", () => {
    const test = new Test({
      ...validTest,
      negativeMarking: {
        enabled: true,
        coefficient: 0.25,
      },
    });

    expect(test.validateSync()).toBeUndefined();
  });

  it("should reject negative marking without coefficient", async () => {
    const test = new Test({
      ...validTest,
      negativeMarking: {
        enabled: true,
        coefficient: 0,
      },
    });

    await expect(test.validate()).rejects.toThrow(
      "Coefficient must be greater than 0 when negative marking is enabled"
    );
  });

  it("should support question randomization", () => {
    const test = new Test({
      ...validTest,
      randomization: {
        questions: true,
        options: false,
      },
    });

    expect(test.validateSync()).toBeUndefined();
  });

  it("should support option randomization", () => {
    const test = new Test({
      ...validTest,
      randomization: {
        questions: false,
        options: true,
      },
    });

    expect(test.validateSync()).toBeUndefined();
  });

  it("should support on-demand schedule", () => {
    const test = new Test({
      ...validTest,
      schedule: {
        mode: SCHEDULE_MODES.ON_DEMAND,
      },
    });

    expect(test.validateSync()).toBeUndefined();
  });

  it("should require start and end time for scheduled test", async () => {
    const test = new Test({
      ...validTest,
      schedule: {
        mode: SCHEDULE_MODES.SCHEDULED,
      },
    });

    await expect(test.validate()).rejects.toThrow(
      "Scheduled tests require startAt and endAt"
    );
  });

  it("should reject scheduled test with invalid time window", async () => {
    const test = new Test({
      ...validTest,
      schedule: {
        mode: SCHEDULE_MODES.SCHEDULED,
        startAt: new Date("2026-09-10T10:00:00Z"),
        endAt: new Date("2026-09-10T09:00:00Z"),
      },
    });

    await expect(test.validate()).rejects.toThrow(
      "endAt must be later than startAt"
    );
  });

  it("should require createdBy", () => {
    const test = new Test({
      ...validTest,
      createdBy: undefined,
    });

    const error = test.validateSync();

    expect(error.errors.createdBy).toBeDefined();
  });
});

