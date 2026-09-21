import { streamRagChat } from "../services/openRouterChat.service.js";

export const ragChatStreamController = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const { query, limit, minScore, filters } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "query is required and must be a non-empty string" })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
    return;
  }

  if (limit !== undefined && (typeof limit !== "number" || !Number.isFinite(limit) || limit < 1)) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "limit must be a positive finite number" })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
    return;
  }

  if (minScore !== undefined && (typeof minScore !== "number" || !Number.isFinite(minScore) || minScore < 0 || minScore > 1)) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "minScore must be a number between 0 and 1" })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
    return;
  }

  if (filters !== undefined && (typeof filters !== "object" || Array.isArray(filters))) {
    res.write(`data: ${JSON.stringify({ type: "error", message: "filters must be a plain object" })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
    return;
  }

  req.on("close", () => {
    // Client disconnected
  });

  try {
    for await (const event of streamRagChat(query, { limit, minScore, filters })) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: "error", message: err.message || "Stream failed" })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  res.end();
};
