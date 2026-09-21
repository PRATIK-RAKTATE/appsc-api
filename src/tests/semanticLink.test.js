/**
 * semanticLink.test.js
 *
 * Tests for the semantic-link feature split into three describe blocks:
 *   1. semanticLink.service  — unit tests against the real service, mocking DB models
 *   2. semanticLink.queue    — unit tests against the real queue, mocking BullMQ
 *   3. semanticLink.worker   — unit tests against the real worker, mocking BullMQ + service
 *
 * Each describe block calls vi.resetModules() in beforeEach so the module registry
 * is fresh and module-level vi.mock declarations are re-applied per test.
 *
 * NOTE: The worker needs the service to be mocked, but the service describe block
 * needs the REAL service. We achieve this with vi.doMock (which is scoped) inside
 * the worker describe block after vi.resetModules().
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mock factories (created before any import, stable across resets)
// ---------------------------------------------------------------------------
const {
  // CurrentAffairs model
  mockCurrentAffairsFindById,
  mockCurrentAffairsFindByIdAndUpdate,
  // CurrentAffairsChunk model
  mockCurrentAffairsChunkFind,
  // KnowledgeChunk model
  mockKnowledgeChunkAggregate,
  // BullMQ
  mockWorkerCtor,
  mockGetJob,
  mockAdd,
  mockRemove,
  mockQueueCtor,
  // Service (used only in worker tests)
  mockLinkCurrentAffairsToChapters,
} = vi.hoisted(() => ({
  mockCurrentAffairsFindById: vi.fn(),
  mockCurrentAffairsFindByIdAndUpdate: vi.fn(),
  mockCurrentAffairsChunkFind: vi.fn(),
  mockKnowledgeChunkAggregate: vi.fn(),
  mockWorkerCtor: vi.fn(),
  mockGetJob: vi.fn(),
  mockAdd: vi.fn(),
  mockRemove: vi.fn(),
  mockQueueCtor: vi.fn(),
  mockLinkCurrentAffairsToChapters: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Module-level mocks — these are re-applied after every vi.resetModules()
// ---------------------------------------------------------------------------
vi.mock("../models/currentAffairs.model.js", () => ({
  CurrentAffairs: {
    findById: mockCurrentAffairsFindById,
    findByIdAndUpdate: mockCurrentAffairsFindByIdAndUpdate,
  },
  RAG_STATUS: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  },
}));

vi.mock("../models/currentAffairsChunk.model.js", () => ({
  CurrentAffairsChunk: {
    find: mockCurrentAffairsChunkFind,
  },
}));

vi.mock("../models/knowledgeChunk.model.js", () => ({
  KnowledgeChunk: {
    aggregate: mockKnowledgeChunkAggregate,
  },
}));

vi.mock("bullmq", () => ({
  Queue: mockQueueCtor,
  Worker: mockWorkerCtor,
}));

vi.mock("../config/redis.js", () => ({
  redisConnection: {},
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a fake 1536-dimension embedding vector. */
const fakeEmbedding = (fill = 0.1) => Array(1536).fill(fill);

/** Build a fake CurrentAffairsChunk document. */
const makeChunk = (index = 0, fill = 0.1) => ({
  _id: `chunk-${index}`,
  currentAffairsId: "ca-123",
  chunkIndex: index,
  embedding: fakeEmbedding(fill),
});

/** Build a fake KnowledgeChunk aggregate hit. */
const makeKcHit = (chapterId, score) => ({
  _id: `kc-${chapterId}`,
  chapterId,
  score,
});

// ===========================================================================
// 1. SERVICE — semanticLink.service.js
// ===========================================================================
describe("semanticLink.service — linkCurrentAffairsToChapters", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockCurrentAffairsFindByIdAndUpdate.mockResolvedValue({});
    mockKnowledgeChunkAggregate.mockResolvedValue([]);
  });

  it("throws when currentAffairsId is missing", async () => {
    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );
    await expect(linkCurrentAffairsToChapters()).rejects.toThrow(
      "currentAffairsId is required"
    );
  });

  it("throws when article is not found", async () => {
    mockCurrentAffairsFindById.mockResolvedValue(null);
    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );
    await expect(
      linkCurrentAffairsToChapters("nonexistent-id")
    ).rejects.toThrow("CurrentAffairs not found: nonexistent-id");
  });

  it("marks semanticLinkStatus PROCESSING at start and COMPLETED at end", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([makeChunk(0)]),
    });
    mockKnowledgeChunkAggregate.mockResolvedValue([
      makeKcHit("chapter-A", 0.9),
    ]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    await linkCurrentAffairsToChapters("ca-123");

    expect(mockCurrentAffairsFindByIdAndUpdate).toHaveBeenCalledWith("ca-123", {
      semanticLinkStatus: "PROCESSING",
    });

    expect(mockCurrentAffairsFindByIdAndUpdate).toHaveBeenCalledWith(
      "ca-123",
      expect.objectContaining({
        semanticLinkStatus: "COMPLETED",
        semanticLinkIndexedAt: expect.any(Date),
      })
    );
  });

  it("returns [] and marks COMPLETED when no chunks exist (RAG not yet run)", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    });

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    const result = await linkCurrentAffairsToChapters("ca-123");

    expect(result).toEqual([]);
    expect(mockCurrentAffairsFindByIdAndUpdate).toHaveBeenCalledWith("ca-123", {
      relatedChapters: [],
      semanticLinkStatus: "COMPLETED",
      semanticLinkIndexedAt: expect.any(Date),
    });
    // No vector search when there are no chunks
    expect(mockKnowledgeChunkAggregate).not.toHaveBeenCalled();
  });

  it("runs a separate $vectorSearch for each chunk", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([makeChunk(0), makeChunk(1), makeChunk(2)]),
    });
    mockKnowledgeChunkAggregate.mockResolvedValue([]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    await linkCurrentAffairsToChapters("ca-123");

    // One aggregate call per chunk
    expect(mockKnowledgeChunkAggregate).toHaveBeenCalledTimes(3);
  });

  it("deduplicates chapters across chunks, keeping the highest score per chapter", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([makeChunk(0), makeChunk(1)]),
    });

    // Chunk 0 → chapter-A:0.82, chapter-B:0.78
    // Chunk 1 → chapter-A:0.91 (higher), chapter-C:0.80
    mockKnowledgeChunkAggregate
      .mockResolvedValueOnce([
        makeKcHit("chapter-A", 0.82),
        makeKcHit("chapter-B", 0.78),
      ])
      .mockResolvedValueOnce([
        makeKcHit("chapter-A", 0.91),
        makeKcHit("chapter-C", 0.80),
      ]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    const result = await linkCurrentAffairsToChapters("ca-123");

    // chapter-A appears once, with the higher score
    const chapterAEntries = result.filter((r) => r.chapterId === "chapter-A");
    expect(chapterAEntries).toHaveLength(1);
    expect(chapterAEntries[0].score).toBe(0.91);
  });

  it("returns at most 3 chapters sorted by score descending", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([makeChunk(0)]),
    });

    // Five distinct chapters — only top 3 should survive
    mockKnowledgeChunkAggregate.mockResolvedValue([
      makeKcHit("ch-1", 0.95),
      makeKcHit("ch-2", 0.88),
      makeKcHit("ch-3", 0.83),
      makeKcHit("ch-4", 0.79),
      makeKcHit("ch-5", 0.76),
    ]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    const result = await linkCurrentAffairsToChapters("ca-123");

    expect(result).toHaveLength(3);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
    expect(result[0].chapterId).toBe("ch-1");
  });

  it("persists relatedChapters to CurrentAffairs on the final findByIdAndUpdate call", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([makeChunk(0)]),
    });

    mockKnowledgeChunkAggregate.mockResolvedValue([
      makeKcHit("ch-X", 0.9),
      makeKcHit("ch-Y", 0.85),
    ]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    await linkCurrentAffairsToChapters("ca-123");

    // The last call should contain relatedChapters
    const lastCall = mockCurrentAffairsFindByIdAndUpdate.mock.calls.at(-1);
    expect(lastCall[0]).toBe("ca-123");
    expect(lastCall[1]).toMatchObject({
      relatedChapters: expect.arrayContaining([
        expect.objectContaining({ chapterId: "ch-X", score: expect.any(Number) }),
        expect.objectContaining({ chapterId: "ch-Y", score: expect.any(Number) }),
      ]),
      semanticLinkStatus: "COMPLETED",
      semanticLinkIndexedAt: expect.any(Date),
    });
  });

  it("skips chunks that have no embedding (null or empty array)", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        { _id: "chunk-0", chunkIndex: 0, embedding: null },  // skip
        { _id: "chunk-1", chunkIndex: 1, embedding: [] },    // skip
        makeChunk(2),                                          // valid → 1 search
      ]),
    });
    mockKnowledgeChunkAggregate.mockResolvedValue([makeKcHit("ch-A", 0.88)]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    await linkCurrentAffairsToChapters("ca-123");

    // Only the one valid chunk should trigger a vector search
    expect(mockKnowledgeChunkAggregate).toHaveBeenCalledTimes(1);
  });

  it("uses correct $vectorSearch pipeline structure against KnowledgeChunk", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    const chunk = makeChunk(0, 0.5);
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([chunk]),
    });
    mockKnowledgeChunkAggregate.mockResolvedValue([]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    await linkCurrentAffairsToChapters("ca-123");

    const pipeline = mockKnowledgeChunkAggregate.mock.calls[0][0];

    // Stage 0: $vectorSearch
    expect(pipeline[0]).toHaveProperty("$vectorSearch");
    const vs = pipeline[0].$vectorSearch;
    expect(vs).toMatchObject({
      path: "embedding",
      queryVector: chunk.embedding,
    });
    expect(vs.numCandidates).toBeGreaterThanOrEqual(100);
    expect(vs.limit).toBeGreaterThan(0);

    // Stage 1: $project must include score via $meta
    expect(pipeline[1]).toHaveProperty("$project");
    expect(pipeline[1].$project.score).toEqual({ $meta: "vectorSearchScore" });
    expect(pipeline[1].$project.chapterId).toBe(1);

    // Stage 2: $match filters by minimum score
    expect(pipeline[2]).toHaveProperty("$match");
    expect(pipeline[2].$match.score).toHaveProperty("$gte");
    expect(pipeline[2].$match.score.$gte).toBeGreaterThan(0);
  });

  it("rolls back semanticLinkStatus to FAILED when an error is thrown", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-err" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([makeChunk(0)]),
    });
    mockKnowledgeChunkAggregate.mockRejectedValue(new Error("Atlas down"));

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    await expect(linkCurrentAffairsToChapters("ca-err")).rejects.toThrow(
      "Atlas down"
    );

    expect(mockCurrentAffairsFindByIdAndUpdate).toHaveBeenCalledWith("ca-err", {
      semanticLinkStatus: "FAILED",
    });
  });

  it("rounds scores to 4 decimal places in the saved output", async () => {
    mockCurrentAffairsFindById.mockResolvedValue({ _id: "ca-123" });
    mockCurrentAffairsChunkFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([makeChunk(0)]),
    });

    // Raw score with many decimal places
    mockKnowledgeChunkAggregate.mockResolvedValue([
      makeKcHit("ch-precise", 0.876543219),
    ]);

    const { linkCurrentAffairsToChapters } = await import(
      "../services/semanticLink.service.js"
    );

    const result = await linkCurrentAffairsToChapters("ca-123");

    // 0.876543219 rounded to 4 d.p. = 0.8765
    expect(result[0].score).toBe(0.8765);
  });
});

// ===========================================================================
// 2. QUEUE — semanticLink.queue.js
// ===========================================================================
describe("semanticLink.queue — scheduleSemanticLink", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mockGetJob.mockResolvedValue(null);
    mockAdd.mockResolvedValue({ id: "semantic-link-ca-123" });

    mockQueueCtor.mockImplementation(
      class MockQueue {
        constructor(name, opts) {
          this.name = name;
          this.opts = opts;
          this.getJob = mockGetJob;
          this.add = mockAdd;
        }
      }
    );
  });

  it("creates the queue with the correct name and redis connection", async () => {
    await import("../queues/semanticLink.queue.js");

    expect(mockQueueCtor).toHaveBeenCalledWith("semantic-link", {
      connection: expect.anything(),
    });
  });

  it("adds a job with the correct payload and BullMQ options", async () => {
    const { scheduleSemanticLink } = await import(
      "../queues/semanticLink.queue.js"
    );

    const job = await scheduleSemanticLink("ca-123");

    expect(mockAdd).toHaveBeenCalledWith(
      "process-semantic-link",
      { currentAffairsId: "ca-123" },
      {
        jobId: "semantic-link-ca-123",
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
        removeOnFail: 100,
      }
    );

    expect(job).toEqual({ id: "semantic-link-ca-123" });
  });

  it("throws when currentAffairsId is not provided", async () => {
    const { scheduleSemanticLink } = await import(
      "../queues/semanticLink.queue.js"
    );

    await expect(scheduleSemanticLink()).rejects.toThrow(
      "currentAffairsId is required"
    );

    expect(mockGetJob).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("returns the existing job without enqueueing again when state is 'waiting'", async () => {
    const existingJob = {
      id: "semantic-link-ca-123",
      getState: vi.fn().mockResolvedValue("waiting"),
    };
    mockGetJob.mockResolvedValue(existingJob);

    const { scheduleSemanticLink } = await import(
      "../queues/semanticLink.queue.js"
    );

    const result = await scheduleSemanticLink("ca-123");

    expect(result).toBe(existingJob);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("returns the existing job without enqueueing again when state is 'active'", async () => {
    const existingJob = {
      id: "semantic-link-ca-123",
      getState: vi.fn().mockResolvedValue("active"),
    };
    mockGetJob.mockResolvedValue(existingJob);

    const { scheduleSemanticLink } = await import(
      "../queues/semanticLink.queue.js"
    );

    const result = await scheduleSemanticLink("ca-123");

    expect(result).toBe(existingJob);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("returns the existing job without enqueueing again when state is 'delayed'", async () => {
    const existingJob = {
      id: "semantic-link-ca-123",
      getState: vi.fn().mockResolvedValue("delayed"),
    };
    mockGetJob.mockResolvedValue(existingJob);

    const { scheduleSemanticLink } = await import(
      "../queues/semanticLink.queue.js"
    );

    const result = await scheduleSemanticLink("ca-123");

    expect(result).toBe(existingJob);
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("removes a stale completed job before re-adding a fresh one", async () => {
    const staleJob = {
      id: "semantic-link-ca-123",
      getState: vi.fn().mockResolvedValue("completed"),
      remove: mockRemove,
    };
    mockGetJob.mockResolvedValue(staleJob);

    const { scheduleSemanticLink } = await import(
      "../queues/semanticLink.queue.js"
    );

    await scheduleSemanticLink("ca-123");

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it("removes a stale failed job before re-adding a fresh one", async () => {
    const staleJob = {
      id: "semantic-link-ca-123",
      getState: vi.fn().mockResolvedValue("failed"),
      remove: mockRemove,
    };
    mockGetJob.mockResolvedValue(staleJob);

    const { scheduleSemanticLink } = await import(
      "../queues/semanticLink.queue.js"
    );

    await scheduleSemanticLink("ca-123");

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 3. WORKER — semanticLink.worker.js
// ===========================================================================
describe("semanticLink.worker", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Mock the real service so the worker doesn't touch the DB
    vi.doMock("../services/semanticLink.service.js", () => ({
      linkCurrentAffairsToChapters: mockLinkCurrentAffairsToChapters,
    }));

    mockLinkCurrentAffairsToChapters.mockResolvedValue([
      { chapterId: "ch-A", score: 0.91 },
      { chapterId: "ch-B", score: 0.85 },
    ]);

    mockWorkerCtor.mockImplementation(
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

  it("creates the worker targeting the 'semantic-link' queue with concurrency 2", async () => {
    await import("../workers/semanticLink.worker.js");

    expect(mockWorkerCtor).toHaveBeenCalledWith(
      "semantic-link",
      expect.any(Function),
      expect.objectContaining({
        connection: expect.anything(),
        concurrency: 2,
      })
    );
  });

  it("registers 'completed' and 'failed' event handlers", async () => {
    await import("../workers/semanticLink.worker.js");

    const workerInstance = mockWorkerCtor.mock.instances[0];
    expect(workerInstance.on).toHaveBeenCalledWith("completed", expect.any(Function));
    expect(workerInstance.on).toHaveBeenCalledWith("failed", expect.any(Function));
  });

  it("throws when currentAffairsId is missing from job.data", async () => {
    await import("../workers/semanticLink.worker.js");

    const processor = mockWorkerCtor.mock.instances[0].processor;

    await expect(processor({ id: "job-1", data: {} })).rejects.toThrow(
      "currentAffairsId is required"
    );

    expect(mockLinkCurrentAffairsToChapters).not.toHaveBeenCalled();
  });

  it("delegates to linkCurrentAffairsToChapters with the correct ID", async () => {
    await import("../workers/semanticLink.worker.js");

    const processor = mockWorkerCtor.mock.instances[0].processor;

    await processor({ id: "job-1", data: { currentAffairsId: "ca-123" } });

    expect(mockLinkCurrentAffairsToChapters).toHaveBeenCalledWith("ca-123");
  });

  it("returns { currentAffairsId, chapterCount } on success", async () => {
    await import("../workers/semanticLink.worker.js");

    const processor = mockWorkerCtor.mock.instances[0].processor;

    const result = await processor({
      id: "job-1",
      data: { currentAffairsId: "ca-123" },
    });

    expect(result).toEqual({
      currentAffairsId: "ca-123",
      chapterCount: 2,
    });
  });

  it("propagates errors thrown by linkCurrentAffairsToChapters", async () => {
    mockLinkCurrentAffairsToChapters.mockRejectedValue(
      new Error("Vector search failed")
    );

    await import("../workers/semanticLink.worker.js");

    const processor = mockWorkerCtor.mock.instances[0].processor;

    await expect(
      processor({ id: "job-1", data: { currentAffairsId: "ca-err" } })
    ).rejects.toThrow("Vector search failed");
  });

  it("returns chapterCount: 0 when no related chapters are found", async () => {
    mockLinkCurrentAffairsToChapters.mockResolvedValue([]);

    await import("../workers/semanticLink.worker.js");

    const processor = mockWorkerCtor.mock.instances[0].processor;

    const result = await processor({
      id: "job-1",
      data: { currentAffairsId: "ca-empty" },
    });

    expect(result).toEqual({
      currentAffairsId: "ca-empty",
      chapterCount: 0,
    });
  });
});
