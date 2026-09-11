import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  ChatMessage,
  CHAT_MESSAGE_TYPE,
} from "../models/chatMessage.model.js";

describe("ChatMessage Model", () => {
  const threadId = new mongoose.Types.ObjectId();
  const senderId = new mongoose.Types.ObjectId();

  const validMessage = {
    threadId,
    senderId,
    content: "Please share the material for this topic.",
  };

  it("should validate a text message", async () => {
    const message = new ChatMessage(validMessage);

    await expect(message.validate()).resolves.toBeUndefined();
    expect(message.messageType).toBe(CHAT_MESSAGE_TYPE.TEXT);
  });

  it("should require threadId", async () => {
    const message = new ChatMessage({ ...validMessage, threadId: undefined });

    await expect(message.validate()).rejects.toThrow(/threadId/i);
  });

  it("should require senderId", async () => {
    const message = new ChatMessage({ ...validMessage, senderId: undefined });

    await expect(message.validate()).rejects.toThrow(/senderId/i);
  });

  it("should accept every valid message type", async () => {
    for (const messageType of Object.values(CHAT_MESSAGE_TYPE)) {
      const message = new ChatMessage({ ...validMessage, messageType });

      await expect(message.validate()).resolves.toBeUndefined();
    }
  });

  it("should reject an invalid message type", async () => {
    const message = new ChatMessage({
      ...validMessage,
      messageType: "VIDEO",
    });

    await expect(message.validate()).rejects.toThrow(/messageType/i);
  });

  it("should trim content", async () => {
    const message = new ChatMessage({
      ...validMessage,
      content: "  Please share the material.  ",
    });

    await expect(message.validate()).resolves.toBeUndefined();
    expect(message.content).toBe("Please share the material.");
  });

  it("should validate attachment metadata", async () => {
    const message = new ChatMessage({
      ...validMessage,
      attachments: [
        {
          url: "  https://cdn.example.com/notes.pdf  ",
          fileName: "  notes.pdf  ",
          mimeType: "  application/pdf  ",
          size: 1024,
        },
      ],
    });

    await expect(message.validate()).resolves.toBeUndefined();
    expect(message.attachments[0]).toMatchObject({
      url: "https://cdn.example.com/notes.pdf",
      fileName: "notes.pdf",
      mimeType: "application/pdf",
      size: 1024,
    });
  });

  it("should allow an attachment-only message", async () => {
    const message = new ChatMessage({
      threadId,
      senderId,
      messageType: CHAT_MESSAGE_TYPE.FILE,
      attachments: [{ url: "https://cdn.example.com/notes.pdf" }],
    });

    await expect(message.validate()).resolves.toBeUndefined();
    expect(message.content).toBeUndefined();
  });

  it("should reject attachment metadata without a URL", async () => {
    const message = new ChatMessage({
      ...validMessage,
      attachments: [{ fileName: "notes.pdf", size: -1 }],
    });

    await expect(message.validate()).rejects.toThrow(/attachments\.0\.(url|size)/i);
  });

  it("should store delivery and read receipts", async () => {
    const deliveredAt = new Date("2026-01-10T10:00:00.000Z");
    const readAt = new Date("2026-01-10T10:01:00.000Z");
    const message = new ChatMessage({ ...validMessage, deliveredAt, readAt });

    await expect(message.validate()).resolves.toBeUndefined();
    expect(message.deliveredAt).toEqual(deliveredAt);
    expect(message.readAt).toEqual(readAt);
  });

  it("should define timestamp paths", () => {
    expect(ChatMessage.schema.path("createdAt")).toBeDefined();
    expect(ChatMessage.schema.path("updatedAt")).toBeDefined();
  });

  it("should define indexes for thread history and unread-message queries", () => {
    const indexes = ChatMessage.schema.indexes();

    const hasThreadTimelineIndex = indexes.some(([fields]) => (
      fields.threadId === 1 && fields.createdAt === 1
    ));
    const hasUnreadMessageIndex = indexes.some(([fields]) => (
      fields.threadId === 1 && fields.readAt === 1 && fields.createdAt === -1
    ));

    expect(hasThreadTimelineIndex).toBe(true);
    expect(hasUnreadMessageIndex).toBe(true);
  });
});
