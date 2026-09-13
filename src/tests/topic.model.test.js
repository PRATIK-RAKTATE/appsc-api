import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import  { Topic }  from "../models/topic.model.js";

describe("Topic Schema", () => {
  it("should create a valid topic", () => {
    const topic = new Topic({
      subjectID: new mongoose.Types.ObjectId(),
      topicName: "Fundamental Rights",
      topicKey: "fundamental-rights",
    });

    const error = topic.validateSync();

    expect(error).toBeUndefined();
  });

  it("should require subjectID", () => {
    const topic = new Topic({
      topicName: "Fundamental Rights",
      topicKey: "fundamental-rights",
    });

    const error = topic.validateSync();

    expect(error.errors.subjectID).toBeDefined();
  });

  it("should require topicName", () => {
    const topic = new Topic({
      subjectID: new mongoose.Types.ObjectId(),
      topicKey: "fundamental-rights",
    });

    const error = topic.validateSync();

    expect(error.errors.topicName).toBeDefined();
  });

  it("should require topicKey", () => {
    const topic = new Topic({
      subjectID: new mongoose.Types.ObjectId(),
      topicName: "Fundamental Rights",
    });

    const error = topic.validateSync();

    expect(error.errors.topicKey).toBeDefined();
  });

  it("should accept a valid ObjectId for subjectID", () => {
    const subjectID = new mongoose.Types.ObjectId();

    const topic = new Topic({
      subjectID,
      topicName: "Fundamental Rights",
      topicKey: "fundamental-rights",
    });

    expect(topic.subjectID).toEqual(subjectID);
  });

  it("should convert topicKey to lowercase", () => {
    const topic = new Topic({
      subjectID: new mongoose.Types.ObjectId(),
      topicName: "Fundamental Rights",
      topicKey: "FUNDAMENTAL-RIGHTS",
    });

    expect(topic.topicKey).toBe("fundamental-rights");
  });

  it("should trim topicName and topicKey", () => {
    const topic = new Topic({
      subjectID: new mongoose.Types.ObjectId(),
      topicName: "  Fundamental Rights  ",
      topicKey: "  FUNDAMENTAL-RIGHTS  ",
    });

    expect(topic.topicName).toBe("Fundamental Rights");
    expect(topic.topicKey).toBe("fundamental-rights");
  });

  it("should set isActive to true by default", () => {
    const topic = new Topic({
      subjectID: new mongoose.Types.ObjectId(),
      topicName: "Fundamental Rights",
      topicKey: "fundamental-rights",
    });

    expect(topic.isActive).toBe(true);
  });

  it("should allow isActive to be false", () => {
    const topic = new Topic({
      subjectID: new mongoose.Types.ObjectId(),
      topicName: "Fundamental Rights",
      topicKey: "fundamental-rights",
      isActive: false,
    });

    expect(topic.isActive).toBe(false);
  });

 it("should have createdAt and updatedAt timestamp fields", () => {
    expect(Topic.schema.path("createdAt")).toBeDefined();
    expect(Topic.schema.path("updatedAt")).toBeDefined();
  });

  it("should use the Topic model", () => {
    expect(Topic.modelName).toBe("Topic");
  });

  it("should have a unique compound index on subjectID and topicKey", () => {
    const indexes = Topic.schema.indexes();

    const compoundIndex = indexes.find(
      ([fields]) => fields.subjectID === 1 && fields.topicKey === 1,
    );

    expect(compoundIndex).toBeDefined();
    expect(compoundIndex[1].unique).toBe(true);
  });
});
