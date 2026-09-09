import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  ChatReport,
  REPORT_REASON,
  REPORT_STATUS,
} from "../models/chatReport.model.js";

describe("ChatReport Schema", () => {
  const reporterId = new mongoose.Types.ObjectId();
  const reportedUserId = new mongoose.Types.ObjectId();
  const messageId = new mongoose.Types.ObjectId();
  const chatId = new mongoose.Types.ObjectId();

  const validReport = {
    reporterId,
    reportedUserId,
    messageId,
    chatId,
    reason: REPORT_REASON.SPAM,
    description: "The user is repeatedly sending promotional messages.",
  };

  it("should create a valid chat report", () => {
    const report = new ChatReport(validReport);
    expect(report.validateSync()).toBeUndefined();
  });

  it("should apply default status PENDING", () => {
    const report = new ChatReport(validReport);
    expect(report.status).toBe(REPORT_STATUS.PENDING);
  });

  it("should require reporterId", () => {
    const report = new ChatReport({
      ...validReport,
      reporterId: undefined,
    });

    const error = report.validateSync();
    expect(error.errors.reporterId).toBeDefined();
  });

  it("should require reportedUserId", () => {
    const report = new ChatReport({
      ...validReport,
      reportedUserId: undefined,
    });

    const error = report.validateSync();
    expect(error.errors.reportedUserId).toBeDefined();
  });

  it("should require messageId", () => {
    const report = new ChatReport({
      ...validReport,
      messageId: undefined,
    });

    const error = report.validateSync();
    expect(error.errors.messageId).toBeDefined();
  });

  it("should require chatId", () => {
    const report = new ChatReport({
      ...validReport,
      chatId: undefined,
    });

    const error = report.validateSync();
    expect(error.errors.chatId).toBeDefined();
  });

  it("should require reason", () => {
    const report = new ChatReport({
      ...validReport,
      reason: undefined,
    });

    const error = report.validateSync();
    expect(error.errors.reason).toBeDefined();
  });

  it("should accept optional description", () => {
    const report = new ChatReport({
      ...validReport,
      description: undefined,
    });

    expect(report.validateSync()).toBeUndefined();
  });

  it("should accept all valid report reasons", () => {
    const reasons = Object.values(REPORT_REASON);
    reasons.forEach((reason) => {
      const report = new ChatReport({ ...validReport, reason });
      expect(report.validateSync()).toBeUndefined();
    });
  });

  it("should reject invalid report reason", () => {
    const report = new ChatReport({
      ...validReport,
      reason: "INVALID_REASON",
    });

    const error = report.validateSync();
    expect(error.errors.reason).toBeDefined();
  });

  it("should accept all valid report statuses", () => {
    const statuses = Object.values(REPORT_STATUS);
    statuses.forEach((status) => {
      const report = new ChatReport({ ...validReport, status });
      expect(report.validateSync()).toBeUndefined();
    });
  });

  it("should reject invalid report status", () => {
    const report = new ChatReport({
      ...validReport,
      status: "INVALID_STATUS",
    });

    const error = report.validateSync();
    expect(error.errors.status).toBeDefined();
  });

  it("should accept optional resolution and adminNotes", () => {
    const report = new ChatReport({
      ...validReport,
      reviewedBy: new mongoose.Types.ObjectId(),
      reviewedAt: new Date(),
      adminNotes: "Admin notes here",
      resolution: "User warned",
    });

    expect(report.validateSync()).toBeUndefined();
    expect(report.adminNotes).toBe("Admin notes here");
    expect(report.resolution).toBe("User warned");
  });

  it("should correctly export REPORT_REASON constants", () => {
    expect(REPORT_REASON.HARASSMENT).toBe("HARASSMENT");
    expect(REPORT_REASON.SPAM).toBe("SPAM");
    expect(REPORT_REASON.HATE_SPEECH).toBe("HATE_SPEECH");
    expect(REPORT_REASON.INAPPROPRIATE_CONTENT).toBe("INAPPROPRIATE_CONTENT");
    expect(REPORT_REASON.VIOLENCE).toBe("VIOLENCE");
    expect(REPORT_REASON.SCAM).toBe("SCAM");
    expect(REPORT_REASON.OTHER).toBe("OTHER");
  });

  it("should correctly export REPORT_STATUS constants", () => {
    expect(REPORT_STATUS.PENDING).toBe("PENDING");
    expect(REPORT_STATUS.UNDER_REVIEW).toBe("UNDER_REVIEW");
    expect(REPORT_STATUS.RESOLVED).toBe("RESOLVED");
    expect(REPORT_STATUS.DISMISSED).toBe("DISMISSED");
  });
});
