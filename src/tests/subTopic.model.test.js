import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import  { SubTopic }  from "../models/subTopic.model.js";

describe("SubTopic Schema", () => {
  it("should create a valid subtopic", () => {
    const subTopic = new SubTopic({
      topicID: new mongoose.Types.ObjectId(),
      subTopicName: "Fundamental Rights",
      subTopicKey: "fundamental-rights",
    });

    const error = subTopic.validateSync();

    expect(error).toBeUndefined();
  });

  it("should require topicID", () => {
    const subTopic = new SubTopic({
      subTopicName: "Fundamental Rights",
      subTopicKey: "fundamental-rights",
    });

    const error = subTopic.validateSync();

    expect(error.errors.topicID).toBeDefined();
  });

  it("should require subTopicName", () => {
    const subTopic = new SubTopic({
      topicID: new mongoose.Types.ObjectId(),
      subTopicKey: "fundamental-rights",
    });

    const error = subTopic.validateSync();

    expect(error.errors.subTopicName).toBeDefined();
  });

  it("should require subTopicKey", () => {
    const subTopic = new SubTopic({
      topicID: new mongoose.Types.ObjectId(),
      subTopicName: "Fundamental Rights",
    });

    const error = subTopic.validateSync();

    expect(error.errors.subTopicKey).toBeDefined();
  });

  it("should accept a valid ObjectId for topicID", () => {
    const topicID = new mongoose.Types.ObjectId();

    const subTopic = new SubTopic({
      topicID,
      subTopicName: "Fundamental Rights",
      subTopicKey: "fundamental-rights",
    });

    expect(subTopic.topicID).toEqual(topicID);
  });

  it("should convert subTopicKey to lowercase", () => {
    const subTopic = new SubTopic({
      topicID: new mongoose.Types.ObjectId(),
      subTopicName: "Fundamental Rights",
      subTopicKey: "FUNDAMENTAL-RIGHTS",
    });

    expect(subTopic.subTopicKey).toBe("fundamental-rights");
  });

  it("should trim subTopicName and subTopicKey", () => {
    const subTopic = new SubTopic({
      topicID: new mongoose.Types.ObjectId(),
      subTopicName: "  Fundamental Rights  ",
      subTopicKey: "  FUNDAMENTAL-RIGHTS  ",
    });

    expect(subTopic.subTopicName).toBe("Fundamental Rights");
    expect(subTopic.subTopicKey).toBe("fundamental-rights");
  });

  it("should set isActive to true by default", () => {
    const subTopic = new SubTopic({
      topicID: new mongoose.Types.ObjectId(),
      subTopicName: "Fundamental Rights",
      subTopicKey: "fundamental-rights",
    });

    expect(subTopic.isActive).toBe(true);
  });

  it("should allow isActive to be false", () => {
    const subTopic = new SubTopic({
      topicID: new mongoose.Types.ObjectId(),
      subTopicName: "Fundamental Rights",
      subTopicKey: "fundamental-rights",
      isActive: false,
    });

    expect(subTopic.isActive).toBe(false);
  });

  it("should have createdAt and updatedAt timestamp fields", () => {
     expect(SubTopic.schema.path("createdAt")).toBeDefined();
     expect(SubTopic.schema.path("updatedAt")).toBeDefined();
   });

  it("should use the SubTopic model", () => {
    expect(SubTopic.modelName).toBe("SubTopic");
  });

  it("should have a unique compound index on topicID and subTopicKey", () => {
    const indexes = SubTopic.schema.indexes();

    const compoundIndex = indexes.find(
      ([fields]) => fields.topicID === 1 && fields.subTopicKey === 1,
    );

    expect(compoundIndex).toBeDefined();
    expect(compoundIndex[1].unique).toBe(true);
  });
});
