/**
 * ragStudyAssistant.service.js
 *
 * Smart AI Study Assistant — Dynamic RAG Chain Routing
 *
 * Pipeline:
 *   1. Academic guardrail check
 *   2. Vector search against internal knowledge base
 *   3. Route decision: internal (score ≥ 0.65) vs. web fallback (score < 0.65)
 *   4. Quota check before any paid web search
 *   5. Build context-aware LLM prompt
 *   6. Call OpenRouter LLM and return structured response
 *
 * Source labels:
 *   INTERNAL_BOOKS — answered from internal vector knowledge base
 *   WEB_SEARCH     — answered using Tavily web search results
 *   GENERAL_LLM    — answered from model general knowledge (fallback when
 *                    web is unavailable / quota exceeded)
 */

import { validateAcademicPrompt } from "../utils/academicGuardrail.js";
import { retrieveSimilarChunks } from "./vectorRetrieval.service.js";
import { checkAndIncrementWebQuota } from "./aiQuota.service.js";
import { performWebSearch } from "./webSearch.service.js";
import { openRouterConfig } from "../config/openrouter.js";

/**
 * Minimum cosine-similarity score threshold.
 * Chunks at or above this threshold are considered "high-confidence internal" matches.
 */
const INTERNAL_SCORE_THRESHOLD = 0.65;

/**
 * Number of internal chunks to include in the LLM context.
 */
const VECTOR_SEARCH_LIMIT = 5;

/**
 * OpenRouter chat model to use for answer synthesis.
 * Falls back to a sensible default if the env var is not set.
 */
const LLM_MODEL =
  process.env.OPENROUTER_CHAT_MODEL || "google/gemini-flash-1.5";

// ---------------------------------------------------------------------------
// LLM call helper
// ---------------------------------------------------------------------------

/**
 * Call OpenRouter chat completions endpoint.
 *
 * @param {Array<{ role: string, content: string }>} messages
 * @returns {Promise<string>} The assistant's text response.
 */
const callLLM = async (messages) => {
  if (!openRouterConfig.apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(`${openRouterConfig.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openRouterConfig.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "https://appsc-api.local",
      "X-Title": "APPSC Study Assistant",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown");
    throw new Error(`OpenRouter LLM call failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error("Invalid LLM response structure");
  }

  return text.trim();
};

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_INTERNAL = `You are an expert AI Study Assistant specialised in Indian competitive exam preparation (UPSC, APPSC, SSC, IBPS, etc.).
Answer the student's question clearly and accurately using ONLY the context provided from the textbook/study material.
- Be concise but thorough.
- Use bullet points or numbered lists where helpful.
- If the context is insufficient, say so explicitly rather than guessing.
- Do NOT invent facts not present in the context.`;

const SYSTEM_PROMPT_WEB = `You are an expert AI Study Assistant specialised in Indian competitive exam preparation.
Use the following verified web snippets to answer the competitive exam question.
- Synthesise information from the snippets into a clear, exam-focused answer.
- Always cite the reference URLs at the bottom of your answer under a "References:" section.
- Do NOT fabricate information beyond what the snippets contain.`;

const SYSTEM_PROMPT_GENERAL = `You are an expert AI Study Assistant specialised in Indian competitive exam preparation (UPSC, APPSC, SSC, IBPS, etc.).
Answer the student's question using your general training knowledge.
- Note at the start: "Based on general knowledge (internal books did not cover this topic):"
- Be factual and exam-relevant.
- Acknowledge uncertainty if present.`;

/**
 * Format internal chunks into a context block.
 * @param {Array<{content: string, title: string}>} chunks
 * @returns {string}
 */
const buildInternalContext = (chunks) =>
  chunks
    .map((c, i) => `[Source ${i + 1}]: ${c.title ? c.title + "\n" : ""}${c.content}`)
    .join("\n\n");

/**
 * Format web search results into a context block.
 * @param {Array<{title: string, url: string, content: string}>} results
 * @returns {string}
 */
const buildWebContext = (results) =>
  results
    .map(
      (r, i) =>
        `[Web Result ${i + 1}]: ${r.title}\nURL: ${r.url}\n${r.content}`
    )
    .join("\n\n");

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------

/**
 * Answer a student's question using the Smart RAG pipeline.
 *
 * @param {object} params
 * @param {string} params.query    - The student's question.
 * @param {string} params.userId   - Authenticated user's ID (for quota tracking).
 * @returns {Promise<{
 *   answer: string,
 *   source: 'INTERNAL_BOOKS' | 'WEB_SEARCH' | 'GENERAL_LLM',
 *   references: Array<{ title: string, url: string }>,
 *   remainingQuota: number | null,
 *   quotaLimit: number | null,
 *   blocked: boolean,
 *   blockReason: string | null,
 * }>}
 */
export const queryStudyAssistant = async ({ query, userId }) => {
  // -------------------------------------------------------------------------
  // Step 1: Academic guardrail
  // -------------------------------------------------------------------------
  const guardResult = validateAcademicPrompt(query);
  if (!guardResult.valid) {
    return {
      answer: guardResult.reason,
      source: null,
      references: [],
      remainingQuota: null,
      quotaLimit: null,
      blocked: true,
      blockReason: "ACADEMIC_GUARDRAIL",
    };
  }

  // -------------------------------------------------------------------------
  // Step 2: Vector search against internal knowledge base
  // -------------------------------------------------------------------------
  let chunks = [];
  try {
    chunks = await retrieveSimilarChunks({
      query,
      limit: VECTOR_SEARCH_LIMIT,
      minScore: 0, // Fetch with no floor so we can inspect the top score ourselves
    });
  } catch (err) {
    console.error("[ragStudyAssistant] Vector search error:", err.message);
    // Continue — fall through to web search or general LLM
  }

  const topScore = chunks.length > 0 ? chunks[0].score : 0;

  // -------------------------------------------------------------------------
  // Step 3: Route decision
  // -------------------------------------------------------------------------
  if (topScore >= INTERNAL_SCORE_THRESHOLD) {
    // ---- Internal books path ----
    const context = buildInternalContext(
      chunks.filter((c) => c.score >= INTERNAL_SCORE_THRESHOLD)
    );

    const messages = [
      { role: "system", content: SYSTEM_PROMPT_INTERNAL },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${query}`,
      },
    ];

    let answer;
    try {
      answer = await callLLM(messages);
    } catch (err) {
      console.error("[ragStudyAssistant] LLM error (internal path):", err.message);
      answer =
        "I found relevant information in the study material but encountered an error generating the answer. Please try again.";
    }

    return {
      answer,
      source: "INTERNAL_BOOKS",
      references: [],
      remainingQuota: null,
      quotaLimit: null,
      blocked: false,
      blockReason: null,
    };
  }

  // ---- Low-confidence / missing data — consider web fallback ----

  // -------------------------------------------------------------------------
  // Step 4: Quota check before web search
  // -------------------------------------------------------------------------
  const quotaResult = await checkAndIncrementWebQuota(userId);

  if (!quotaResult.allowed) {
    // Quota exceeded — fall back to general LLM with disclaimer
    const messages = [
      { role: "system", content: SYSTEM_PROMPT_GENERAL },
      { role: "user", content: query },
    ];

    let answer;
    try {
      answer = await callLLM(messages);
    } catch (err) {
      console.error("[ragStudyAssistant] LLM error (quota-exceeded path):", err.message);
      answer =
        "The internal study material does not cover this topic and your daily web search quota has been reached. " +
        `You have used all ${quotaResult.limit} web searches for today. Please try again tomorrow.`;
    }

    return {
      answer,
      source: "GENERAL_LLM",
      references: [],
      remainingQuota: 0,
      quotaLimit: quotaResult.limit,
      blocked: false,
      blockReason: "QUOTA_EXCEEDED",
    };
  }

  // -------------------------------------------------------------------------
  // Step 5: Web search fallback
  // -------------------------------------------------------------------------
  let webResults = [];
  try {
    webResults = await performWebSearch(query);
  } catch (err) {
    // Already handled inside performWebSearch — but just in case
    console.error("[ragStudyAssistant] Web search error:", err.message);
  }

  if (!webResults.length) {
    // Web search returned nothing — fall back to general LLM with disclaimer
    const messages = [
      { role: "system", content: SYSTEM_PROMPT_GENERAL },
      { role: "user", content: query },
    ];

    let answer;
    try {
      answer = await callLLM(messages);
    } catch (err) {
      console.error("[ragStudyAssistant] LLM error (web-empty path):", err.message);
      answer =
        "The internal study material does not have sufficient information on this topic, " +
        "and the web search did not return relevant results. Please rephrase your question.";
    }

    return {
      answer,
      source: "GENERAL_LLM",
      references: [],
      remainingQuota: quotaResult.remaining,
      quotaLimit: quotaResult.limit,
      blocked: false,
      blockReason: null,
    };
  }

  // ---- Web search has results ----
  const context = buildWebContext(webResults);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT_WEB },
    {
      role: "user",
      content: `Web Search Results:\n${context}\n\nQuestion: ${query}`,
    },
  ];

  let answer;
  try {
    answer = await callLLM(messages);
  } catch (err) {
    console.error("[ragStudyAssistant] LLM error (web path):", err.message);
    // Degrade gracefully: construct a basic answer from snippets
    answer =
      "Based on web search results:\n\n" +
      webResults.map((r) => `- ${r.title}: ${r.content}`).join("\n\n") +
      "\n\nReferences:\n" +
      webResults.map((r, i) => `${i + 1}. ${r.url}`).join("\n");
  }

  return {
    answer,
    source: "WEB_SEARCH",
    references: webResults.map((r) => ({ title: r.title, url: r.url })),
    remainingQuota: quotaResult.remaining,
    quotaLimit: quotaResult.limit,
    blocked: false,
    blockReason: null,
  };
};
