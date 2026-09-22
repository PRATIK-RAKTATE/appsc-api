import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Hoist mocks ──────────────────────────────────────────────────────────────
const { mockRetrieveSimilarChunks } = vi.hoisted(() => ({
  mockRetrieveSimilarChunks: vi.fn(),
}));

vi.mock("../services/vectorRetrieval.service.js", () => ({
  retrieveSimilarChunks: mockRetrieveSimilarChunks,
}));

import { vectorSearchController } from "../controllers/vectorSearch.controller.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const makeReq = (body = {}) => ({ body, user: { userId: "admin-1", role: "ADMIN" } });

const sampleChunks = [
  {
    chunkId: "chunk-1",
    content: "Polity content about fundamental rights.",
    title: "Chapter 2",
    score: 0.88,
    metadata: { subject: "Polity", language: "EN" },
  },
  {
    chunkId: "chunk-2",
    content: "More content about directive principles.",
    title: "Chapter 3",
    score: 0.76,
    metadata: { subject: "Polity", language: "EN" },
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("vectorSearch.controller – vectorSearchController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRetrieveSimilarChunks.mockResolvedValue(sampleChunks);
  });

  // ── 400 validation cases ──────────────────────────────────────────────────
  describe("400 Bad Request – query validation", () => {
    it("should return 400 when query is missing", async () => {
      const req = makeReq({});
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("should return 400 when query is an empty string", async () => {
      const req = makeReq({ query: "" });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when query is whitespace only", async () => {
      const req = makeReq({ query: "   " });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when query is a number", async () => {
      const req = makeReq({ query: 123 });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when limit is not a number", async () => {
      const req = makeReq({ query: "polity", limit: "five" });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const body = res.json.mock.calls[0][0];
      expect(body.message).toMatch(/limit/i);
    });

    it("should return 400 when limit is negative", async () => {
      const req = makeReq({ query: "polity", limit: -1 });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when minScore is out of range (> 1)", async () => {
      const req = makeReq({ query: "polity", minScore: 1.5 });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const body = res.json.mock.calls[0][0];
      expect(body.message).toMatch(/minScore/i);
    });

    it("should return 400 when minScore is negative", async () => {
      const req = makeReq({ query: "polity", minScore: -0.1 });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when filters is an array", async () => {
      const req = makeReq({ query: "polity", filters: ["bookId"] });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      const body = res.json.mock.calls[0][0];
      expect(body.message).toMatch(/filters/i);
    });
  });

  // ── 200 success cases ─────────────────────────────────────────────────────
  describe("200 OK – success responses", () => {
    it("should return 200 with results for a valid query", async () => {
      const req = makeReq({ query: "fundamental rights" });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.count).toBe(2);
      expect(body.data).toEqual(sampleChunks);
    });

    it("should include executionTimeMs in the response", async () => {
      const req = makeReq({ query: "directive principles" });
      const res = makeRes();
      await vectorSearchController(req, res);
      const body = res.json.mock.calls[0][0];
      expect(typeof body.executionTimeMs).toBe("number");
      expect(body.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("should return empty data array cleanly when no chunks match", async () => {
      mockRetrieveSimilarChunks.mockResolvedValue([]);
      const req = makeReq({ query: "very obscure topic" });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.count).toBe(0);
      expect(body.data).toEqual([]);
    });

    it("should forward limit, minScore, and filters to retrieveSimilarChunks", async () => {
      const filters = { subject: "History", language: "TE" };
      const req = makeReq({
        query: "Andhra history",
        limit: 10,
        minScore: 0.75,
        filters,
      });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(mockRetrieveSimilarChunks).toHaveBeenCalledWith({
        query: "Andhra history",
        limit: 10,
        minScore: 0.75,
        filters,
      });
    });

    it("should accept valid query with optional params omitted", async () => {
      const req = makeReq({ query: "AP economy" });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(mockRetrieveSimilarChunks).toHaveBeenCalledWith({
        query: "AP economy",
        limit: undefined,
        minScore: undefined,
        filters: undefined,
      });
    });
  });

  // ── 500 error handling ────────────────────────────────────────────────────
  describe("500 Internal Server Error – service failures", () => {
    it("should return 500 when retrieveSimilarChunks throws", async () => {
      mockRetrieveSimilarChunks.mockRejectedValue(
        new Error("Atlas $vectorSearch failed")
      );
      const req = makeReq({ query: "polity" });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.message).toBe("Atlas $vectorSearch failed");
    });

    it("should include executionTimeMs even on error", async () => {
      mockRetrieveSimilarChunks.mockRejectedValue(new Error("timeout"));
      const req = makeReq({ query: "polity" });
      const res = makeRes();
      await vectorSearchController(req, res);
      const body = res.json.mock.calls[0][0];
      expect(typeof body.executionTimeMs).toBe("number");
    });

    it("should not crash when service throws without a message", async () => {
      mockRetrieveSimilarChunks.mockRejectedValue({});
      const req = makeReq({ query: "polity" });
      const res = makeRes();
      await vectorSearchController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(false);
    });
  });
});
