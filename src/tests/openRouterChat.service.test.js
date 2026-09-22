import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRetrieveSimilarChunks,
  mockBookFind,
} = vi.hoisted(() => ({
  mockRetrieveSimilarChunks: vi.fn(),
  mockBookFind: vi.fn(),
}));

const mockFetch = vi.fn();

vi.stubGlobal("fetch", mockFetch);

vi.mock("../services/vectorRetrieval.service.js", () => ({
  retrieveSimilarChunks: mockRetrieveSimilarChunks,
}));

vi.mock("../models/book.model.js", () => ({
  Book: {
    find: mockBookFind,
  },
}));

const makeChunk = (overrides = {}) => ({
  chunkId: "chunk-1",
  content: "Sample study content.",
  title: "Chapter 1",
  bookId: "book-1",
  score: 0.85,
  metadata: { pageNumber: 45, chapterId: "ch-1" },
  ...overrides,
});

describe("openRouterChat.service – streamRagChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    process.env.OPENROUTER_API_KEY = "test-key";
  });

  it("should yield an error when query is empty", async () => {
    vi.resetModules();
    const { streamRagChat } = await import("../services/openRouterChat.service.js");

    const events = [];
    for await (const event of streamRagChat("")) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", message: "Query is required" });
  });

  it("should yield an error when query is whitespace", async () => {
    vi.resetModules();
    const { streamRagChat } = await import("../services/openRouterChat.service.js");

    const events = [];
    for await (const event of streamRagChat("   ")) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", message: "Query is required" });
  });

  it("should yield an error when retrieval fails", async () => {
    vi.resetModules();
    const { streamRagChat } = await import("../services/openRouterChat.service.js");

    mockRetrieveSimilarChunks.mockRejectedValue(new Error("DB error"));

    const events = [];
    for await (const event of streamRagChat("test query")) {
      events.push(event);
    }
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "error", message: "Retrieval failed: DB error" });
  });

  it("should yield fallback message when no chunks are found", async () => {
    vi.resetModules();
    const { streamRagChat } = await import("../services/openRouterChat.service.js");

    mockRetrieveSimilarChunks.mockResolvedValue([]);
    mockBookFind.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([]),
    });

    const events = [];
    for await (const event of streamRagChat("test query")) {
      events.push(event);
    }

    expect(events[0].type).toBe("citations");
    expect(events[0].data).toEqual([]);
    expect(events[1].type).toBe("token");
    expect(events[1].content).toContain("don't have enough information");
    expect(events[2]).toMatchObject({ type: "done" });
  });

  it("should yield citations and stream tokens on success", async () => {
    vi.resetModules();
    const { streamRagChat } = await import("../services/openRouterChat.service.js");

    const chunks = [
      makeChunk({ chunkId: "chunk-1", bookId: "book-1", score: 0.9 }),
      makeChunk({ chunkId: "chunk-2", bookId: "book-2", score: 0.8 }),
    ];

    mockRetrieveSimilarChunks.mockResolvedValue(chunks);
    mockBookFind.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        { _id: "book-1", title: "Indian Polity" },
        { _id: "book-2", title: "Indian History" },
      ]),
    });

    const readResults = [
      { done: false, value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n') },
      { done: false, value: new TextEncoder().encode("data: [DONE]\n\n") },
      { done: true, value: new TextEncoder().encode("") },
    ];
    let readIndex = 0;
    const reader = {
      read: () => Promise.resolve(readResults[readIndex++]),
      releaseLock: () => {},
    };

    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => reader,
      },
    });

    const events = [];
    for await (const event of streamRagChat("What is democracy?")) {
      events.push(event);
    }

    const citationEvent = events.find((e) => e.type === "citations");
    expect(citationEvent).toBeDefined();
    expect(citationEvent.data).toHaveLength(2);
    expect(citationEvent.data[0]).toMatchObject({
      citationIndex: 1,
      chunkId: "chunk-1",
      bookId: "book-1",
      bookTitle: "Indian Polity",
      pageNumber: 45,
      score: 0.9,
    });
    expect(citationEvent.data[1]).toMatchObject({
      citationIndex: 2,
      chunkId: "chunk-2",
      bookId: "book-2",
      bookTitle: "Indian History",
      pageNumber: 45,
      score: 0.8,
    });

    const tokenEvents = events.filter((e) => e.type === "token");
    expect(tokenEvents).toHaveLength(1);
    expect(tokenEvents[0].content).toBe("Hello");

    expect(events[events.length - 1]).toMatchObject({ type: "done" });
  });

  it("should yield error when chat completion fails", async () => {
    vi.resetModules();
    const { streamRagChat } = await import("../services/openRouterChat.service.js");

    const chunks = [makeChunk()];
    mockRetrieveSimilarChunks.mockResolvedValue(chunks);
    mockBookFind.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([{ _id: "book-1", title: "Test Book" }]),
    });

    mockFetch.mockResolvedValue({
      ok: false,
      text: async () => "Rate limit exceeded",
    });

    const events = [];
    for await (const event of streamRagChat("test")) {
      events.push(event);
    }

    const errorEvent = events.find((e) => e.type === "error");
    expect(errorEvent).toBeDefined();
    expect(errorEvent.message).toContain("Chat completion failed");
    expect(events[events.length - 1]).toMatchObject({ type: "done" });
  });
});
