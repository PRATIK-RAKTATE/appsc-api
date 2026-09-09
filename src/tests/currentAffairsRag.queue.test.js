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

describe("Current Affairs RAG Queue", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockGetJob.mockResolvedValue(null);

    mockAdd.mockResolvedValue({
      id: "current-affairs-rag-ca-id",
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

  it("should create current-affairs-rag queue", async () => {
    await import("../queues/currentAffairsRag.queue.js");

    expect(mockQueue).toHaveBeenCalledWith(
      "current-affairs-rag",
      {
        connection: expect.anything(),
      }
    );
  });

  it("should add a current affairs RAG job", async () => {
    const { scheduleCurrentAffairsRagIngestion } = await import(
      "../queues/currentAffairsRag.queue.js"
    );

    const job = await scheduleCurrentAffairsRagIngestion("ca-id");

    expect(mockAdd).toHaveBeenCalledWith(
      "process-current-affairs-rag",
      {
        currentAffairsId: "ca-id",
      },
      {
        jobId: "current-affairs-rag-ca-id",
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
      id: "current-affairs-rag-ca-id",
    });
  });

  it("should reject when current affairs ID is missing", async () => {
    const { scheduleCurrentAffairsRagIngestion } = await import(
      "../queues/currentAffairsRag.queue.js"
    );

    await expect(scheduleCurrentAffairsRagIngestion()).rejects.toThrow(
      "Current affairs ID is required"
    );

    expect(mockGetJob).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("should not create duplicate active jobs", async () => {
    mockGetJob.mockResolvedValue({
      getState: vi.fn().mockResolvedValue("waiting"),
    });

    const { scheduleCurrentAffairsRagIngestion } = await import(
      "../queues/currentAffairsRag.queue.js"
    );

    const job = await scheduleCurrentAffairsRagIngestion("ca-id");

    expect(job).toBeDefined();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("should remove an old completed job before adding a new one", async () => {
    const existingJob = {
      getState: vi.fn().mockResolvedValue("completed"),
      remove: mockRemove,
    };

    mockGetJob.mockResolvedValue(existingJob);

    const { scheduleCurrentAffairsRagIngestion } = await import(
      "../queues/currentAffairsRag.queue.js"
    );

    await scheduleCurrentAffairsRagIngestion("ca-id");

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });
});
