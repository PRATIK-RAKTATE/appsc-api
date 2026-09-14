import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  ModerationLog,
  MODERATION_ACTION,
} from "../models/moderationLog.model.js";

describe("ModerationLog Schema", () => {
  const chatId = new mongoose.Types.ObjectId();
  const reportedUserId = new mongoose.Types.ObjectId();
  const actionTakenBy = new mongoose.Types.ObjectId();

  const validLog = {
    chatId,
    reportedUserId,
    action: MODERATION_ACTION.WARNING,
    actionTakenBy,
    notes: "User issued a warning for inappropriate language.",
  };

  it("should create a valid moderation log", () => {
    const log = new ModerationLog(validLog);
    expect(log.validateSync()).toBeUndefined();
  });

  it("should require chatId", () => {
    const log = new ModerationLog({
      ...validLog,
      chatId: undefined,
    });

    const error = log.validateSync();
    expect(error.errors.chatId).toBeDefined();
  });

  it("should allow optional messageId", () => {
    const log = new ModerationLog({
      ...validLog,
      messageId: undefined,
    });

    expect(log.validateSync()).toBeUndefined();
  });

  it("should require reportedUserId", () => {
    const log = new ModerationLog({
      ...validLog,
      reportedUserId: undefined,
    });

    const error = log.validateSync();
    expect(error.errors.reportedUserId).toBeDefined();
  });

  it("should require action", () => {
    const log = new ModerationLog({
      ...validLog,
      action: undefined,
    });

    const error = log.validateSync();
    expect(error.errors.action).toBeDefined();
  });

  it("should require actionTakenBy", () => {
    const log = new ModerationLog({
      ...validLog,
      actionTakenBy: undefined,
    });

    const error = log.validateSync();
    expect(error.errors.actionTakenBy).toBeDefined();
  });

  it("should accept all valid moderation actions", () => {
    const actions = Object.values(MODERATION_ACTION);
    actions.forEach((action) => {
      const log = new ModerationLog({ ...validLog, action });
      expect(log.validateSync()).toBeUndefined();
    });
  });

  it("should reject invalid moderation action", () => {
    const log = new ModerationLog({
      ...validLog,
      action: "INVALID_ACTION",
    });

    const error = log.validateSync();
    expect(error.errors.action).toBeDefined();
  });

  it("should accept optional chatReportId", () => {
    const log = new ModerationLog({
      ...validLog,
      chatReportId: new mongoose.Types.ObjectId(),
    });

    expect(log.validateSync()).toBeUndefined();
  });

  it("should accept optional notes", () => {
    const log = new ModerationLog({
      ...validLog,
      notes: undefined,
    });

    expect(log.validateSync()).toBeUndefined();
  });

  it("should accept long notes up to 2000 characters", () => {
    const longNotes = "a".repeat(2000);
    const log = new ModerationLog({
      ...validLog,
      notes: longNotes,
    });

    expect(log.validateSync()).toBeUndefined();
  });

  it("should correctly export MODERATION_ACTION constants", () => {
    expect(MODERATION_ACTION.WARNING).toBe("WARNING");
    expect(MODERATION_ACTION.MESSAGE_DELETED).toBe("MESSAGE_DELETED");
    expect(MODERATION_ACTION.USER_MUTED).toBe("USER_MUTED");
    expect(MODERATION_ACTION.USER_BANNED).toBe("USER_BANNED");
    expect(MODERATION_ACTION.REPORT_DISMISSED).toBe("REPORT_DISMISSED");
    expect(MODERATION_ACTION.ESCALATED).toBe("ESCALATED");
  });
});
