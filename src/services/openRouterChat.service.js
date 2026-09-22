import { openRouterConfig } from "../config/openrouter.js";
import { retrieveSimilarChunks } from "./vectorRetrieval.service.js";
import { Book } from "../models/book.model.js";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const DEFAULT_MIN_SCORE = 0.7;

const RAG_PROMPT_TEMPLATE = `You are a helpful study assistant for competitive exam preparation. Use the following context to answer the student's question. When you reference information from the context, use the citation marker [N] where N is the citation number.

Context:
{context}

Student Question: {query}

Instructions:
- Base your answer strictly on the context above
- Use [N] citation markers for every claim or fact you make
- Be concise, accurate, and helpful
- If the answer is not in the context, clearly state "I don't have enough information in the provided study materials to answer that."
- Do not make up information or use outside knowledge`;

const enrichChunksWithTitles = async (chunks) => {
  if (!chunks.length) return chunks;

  const bookIds = [
    ...new Set(chunks.map((c) => c.bookId).filter((id) => id && typeof id === "string")),
  ];

  const books = bookIds.length
    ? await Book.find({ _id: { $in: bookIds } }).select("_id title").lean()
    : [];

  const bookMap = new Map(books.map((b) => [b._id.toString(), b.title]));

  return chunks.map((chunk, index) => {
    const bookId = chunk.bookId || "";
    const bookTitle = bookMap.get(bookId) || chunk.title || "Unknown Book";
    const pageNumber = chunk.metadata?.pageNumber || null;

    return {
      ...chunk,
      citationIndex: index + 1,
      bookTitle,
      pageNumber,
    };
  });
};

const buildRagPrompt = (query, chunks) => {
  const contextBlocks = chunks
    .map(
      (chunk) =>
        `[${chunk.citationIndex}] Book: "${chunk.bookTitle}"${chunk.pageNumber ? `, Page: ${chunk.pageNumber}` : ""}\n${chunk.content}`
    )
    .join("\n\n");

  return RAG_PROMPT_TEMPLATE.replace("{context}", contextBlocks).replace("{query}", query);
};

async function* streamChatCompletion(messages) {
  if (!openRouterConfig.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(
    `${openRouterConfig.baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openRouterConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: openRouterConfig.chatModel,
        messages,
        stream: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter chat failed: ${error}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield { type: "token", content: delta };
        } catch {
          // skip malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamRagChat(query, options = {}) {
  if (!query || typeof query !== "string" || !query.trim()) {
    yield { type: "error", message: "Query is required" };
    return;
  }

  const limit = Math.min(
    Math.max(1, Number.isFinite(options.limit) ? Math.floor(options.limit) : DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const minScore =
    Number.isFinite(options.minScore) && options.minScore >= 0 && options.minScore <= 1
      ? options.minScore
      : DEFAULT_MIN_SCORE;
  const filters =
    options.filters && typeof options.filters === "object" && !Array.isArray(options.filters)
      ? options.filters
      : undefined;

  let chunks;
  try {
    chunks = await retrieveSimilarChunks({
      query: query.trim(),
      limit,
      minScore,
      filters,
    });
  } catch (err) {
    yield { type: "error", message: `Retrieval failed: ${err.message}` };
    return;
  }

  const enrichedChunks = await enrichChunksWithTitles(chunks);

  const citations = enrichedChunks.map((c) => ({
    citationIndex: c.citationIndex,
    chunkId: c.chunkId,
    bookId: c.bookId || "",
    bookTitle: c.bookTitle,
    pageNumber: c.pageNumber,
    chapterId: c.metadata?.chapterId || c.chapterId || "",
    score: c.score,
  }));

  yield { type: "citations", data: citations };

  if (!enrichedChunks.length) {
    yield {
      type: "token",
      content:
        "I don't have enough information in the provided study materials to answer that question.",
    };
    yield { type: "done" };
    return;
  }

  const prompt = buildRagPrompt(query.trim(), enrichedChunks);
  const messages = [{ role: "user", content: prompt }];

  try {
    for await (const event of streamChatCompletion(messages)) {
      yield event;
    }
  } catch (err) {
    yield { type: "error", message: `Chat completion failed: ${err.message}` };
  }

  yield { type: "done" };
}
