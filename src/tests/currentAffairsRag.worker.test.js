import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockIngestCurrentAffairsRAG,
  mockWorker,
} = vi.hoisted(() => ({
  mockIngestCurrentAffairsRAG: vi.fn(),
  mockWorker: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Worker: mockWorker,
}));

vi.mock("../config/redis.js", () => ({
  redisConnection: {},
}));

vi.mock("../services/currentAffairsRag.service.js", () => ({
  ingestCurrentAffairsRAG: mockIngestCurrentAffairsRAG,
}));

describe("Current Affairs RAG Worker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockIngestCurrentAffairsRAG.mockResolvedValue([
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

  it("should create worker with correct queue name and options", async () => {
    await import("../workers/currentAffairsRag.worker.js");

    expect(mockWorker).toHaveBeenCalledTimes(1);
    expect(mockWorker).toHaveBeenCalledWith(
      "current-affairs-rag",
      expect.any(Function),
      expect.objectContaining({
        connection: expect.anything(),
        concurrency: 2,
      })
    );
  });

  it("should process current affairs RAG job successfully", async () => {
    await import("../workers/currentAffairsRag.worker.js");

    const workerInstance = mockWorker.mock.instances[0];
    const processor = workerInstance?.processor;

    expect(processor).toBeTypeOf("function");

    const result = await processor({
      id: "job-ca-1",
      data: {
        currentAffairsId: "ca-123",
      },
    });

    expect(mockIngestCurrentAffairsRAG).toHaveBeenCalledWith("ca-123");
    expect(result).toEqual({
      currentAffairsId: "ca-123",
      chunkCount: 2,
    });
  });

  it("should reject when current affairs ID is missing", async () => {
    await import("../workers/currentAffairsRag.worker.js");

    const workerInstance = mockWorker.mock.instances[0];
    const processor = workerInstance.processor;

    await expect(
      processor({
        id: "job-ca-1",
        data: {},
      })
    ).rejects.toThrow("Current affairs ID is required");

    expect(mockIngestCurrentAffairsRAG).not.toHaveBeenCalled();
  });

  it("should propagate error when RAG ingestion fails", async () => {
    mockIngestCurrentAffairsRAG.mockRejectedValue(
      new Error("RAG processing failed")
    );

    await import("../workers/currentAffairsRag.worker.js");

    const workerInstance = mockWorker.mock.instances[0];
    const processor = workerInstance.processor;

    await expect(
      processor({
        id: "job-ca-1",
        data: {
          currentAffairsId: "ca-fail",
        },
      })
    ).rejects.toThrow("RAG processing failed");

    expect(mockIngestCurrentAffairsRAG).toHaveBeenCalledWith("ca-fail");
  });
});
