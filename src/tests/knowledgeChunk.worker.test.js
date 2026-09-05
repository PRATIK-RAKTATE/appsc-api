import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockChapterFindById,
  mockChapterFindByIdAndUpdate,
  mockCreateKnowledgeChunks,
  mockWorker,
} = vi.hoisted(() => ({
  mockChapterFindById: vi.fn(),
  mockChapterFindByIdAndUpdate: vi.fn(),
  mockCreateKnowledgeChunks: vi.fn(),
  mockWorker: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Worker: mockWorker,
}));

vi.mock("../config/redis.js", () => ({
  redisConnection: {},
}));

vi.mock("../models/chapter.model.js", () => ({
  Chapter: {
    findById: mockChapterFindById,
    findByIdAndUpdate: mockChapterFindByIdAndUpdate,
  },
  CHAPTER_STATUS: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },
}));

vi.mock("../services/knowledgeChunk.service.js", () => ({
  createKnowledgeChunks: mockCreateKnowledgeChunks,
}));

describe("Knowledge Chunk Worker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockChapterFindById.mockResolvedValue({
      _id: "chapter-id",
      bookId: "book-id",
      title: "Test Chapter",
    });

    mockChapterFindByIdAndUpdate.mockResolvedValue({});

    mockCreateKnowledgeChunks.mockResolvedValue([
      { _id: "chunk-1" },
      { _id: "chunk-2" },
    ]);

    mockWorker.mockImplementation(
      class MockWorker {
        constructor(queueName, processor, options) {
          this.queueName = queueName;
          this.processor = processor;
          this.options = options;
          this.on = vi.fn();
        }
      }
    );
  });

  it("should create worker with correct configuration", async () => {
    await import("../workers/knowledgeChunk.worker.js");

    expect(mockWorker).toHaveBeenCalledTimes(1);

    expect(mockWorker).toHaveBeenCalledWith(
      "knowledge-chunk",
      expect.any(Function),
      expect.objectContaining({
        connection: expect.anything(),
        concurrency: 2,
      })
    );
  });

  it("should process a knowledge chunk job successfully", async () => {
    await import("../workers/knowledgeChunk.worker.js");

    const workerInstance = mockWorker.mock.instances[0];
    const processor = workerInstance?.processor;

    expect(processor).toBeTypeOf("function");

    const result = await processor({
      id: "job-1",
      data: {
        chapterId: "chapter-id",
      },
    });

    expect(mockChapterFindById).toHaveBeenCalledWith("chapter-id");

    expect(mockChapterFindByIdAndUpdate).toHaveBeenNthCalledWith(
      1,
      "chapter-id",
      {
        status: "PROCESSING",
      }
    );

    expect(mockCreateKnowledgeChunks).toHaveBeenCalledWith(
      "chapter-id"
    );

    expect(mockChapterFindByIdAndUpdate).toHaveBeenNthCalledWith(
      2,
      "chapter-id",
      {
        status: "COMPLETED",
      }
    );

    expect(result).toEqual({
      chapterId: "chapter-id",
      chunkCount: 2,
    });
  });

  it("should reject when chapter ID is missing", async () => {
    await import("../workers/knowledgeChunk.worker.js");

    const workerInstance = mockWorker.mock.instances[0];
    const processor = workerInstance.processor;

    await expect(
      processor({
        id: "job-1",
        data: {},
      })
    ).rejects.toThrow("Chapter ID is required");

    expect(mockChapterFindById).not.toHaveBeenCalled();
  });

  it("should reject when chapter is not found", async () => {
    mockChapterFindById.mockResolvedValue(null);

    await import("../workers/knowledgeChunk.worker.js");

    const workerInstance = mockWorker.mock.instances[0];
    const processor = workerInstance.processor;

    await expect(
      processor({
        id: "job-1",
        data: {
          chapterId: "chapter-id",
        },
      })
    ).rejects.toThrow("Chapter not found");
  });

  it("should mark chapter as FAILED when processing fails", async () => {
    mockCreateKnowledgeChunks.mockRejectedValue(
      new Error("Embedding API failed")
    );

    await import("../workers/knowledgeChunk.worker.js");

    const workerInstance = mockWorker.mock.instances[0];
    const processor = workerInstance.processor;

    await expect(
      processor({
        id: "job-1",
        data: {
          chapterId: "chapter-id",
        },
      })
    ).rejects.toThrow("Embedding API failed");

    expect(mockChapterFindByIdAndUpdate).toHaveBeenNthCalledWith(
      1,
      "chapter-id",
      {
        status: "PROCESSING",
      }
    );

    expect(mockChapterFindByIdAndUpdate).toHaveBeenNthCalledWith(
      2,
      "chapter-id",
      {
        status: "FAILED",
      }
    );
  });
});

