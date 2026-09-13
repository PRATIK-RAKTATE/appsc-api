import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetJob,
  mockAdd,
  mockRemove,
  mockQueue,
} = vi.hoisted(() => ({
  mockGetJob: vi.fn(),
  mockAdd: vi.fn(),
  mockRemove: vi.fn(),
  mockQueue: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Queue: mockQueue,
}));

vi.mock("../config/redis.js", () => ({
  redisConnection: {},
}));

describe("Knowledge Chunk Queue", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockGetJob.mockResolvedValue(null);

    mockAdd.mockResolvedValue({
      id: "knowledge-chunk-chapter-id",
    });

    mockQueue.mockImplementation(
      class MockQueue {
        constructor(queueName, options) {
          this.queueName = queueName;
          this.options = options;
          this.getJob = mockGetJob;
          this.add = mockAdd;
        }
      }
    );
  });

  it("should create knowledge chunk queue", async () => {
    await import("../queues/knowledgeChunk.queue.js");

    expect(mockQueue).toHaveBeenCalledWith(
      "knowledge-chunk",
      {
        connection: expect.anything(),
      }
    );
  });

  it("should add a knowledge chunk job", async () => {
    const { scheduleKnowledgeChunking } = await import(
      "../queues/knowledgeChunk.queue.js"
    );

    const job = await scheduleKnowledgeChunking("chapter-id");

    expect(mockAdd).toHaveBeenCalledWith(
      "process-knowledge-chunk",
      {
        chapterId: "chapter-id",
      },
      {
        jobId: "knowledge-chunk-chapter-id",
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      }
    );

    expect(job).toEqual({
      id: "knowledge-chunk-chapter-id",
    });
  });

  it("should reject when chapter ID is missing", async () => {
    const { scheduleKnowledgeChunking } = await import(
      "../queues/knowledgeChunk.queue.js"
    );

    await expect(
      scheduleKnowledgeChunking()
    ).rejects.toThrow("Chapter ID is required");

    expect(mockGetJob).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("should not create duplicate active jobs", async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue("waiting"),
    });

    const { scheduleKnowledgeChunking } = await import(
      "../queues/knowledgeChunk.queue.js"
    );

    const job = await scheduleKnowledgeChunking("chapter-id");

    expect(job).toBeDefined();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("should remove an old completed job before adding a new one", async () => {
    const existingJob = {
      getState: vi.fn().mockResolvedValue("completed"),
      remove: mockRemove,
    };

    mockGetJob.mockResolvedValue(existingJob);

    const { scheduleKnowledgeChunking } = await import(
      "../queues/knowledgeChunk.queue.js"
    );

    await scheduleKnowledgeChunking("chapter-id");

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });
});

