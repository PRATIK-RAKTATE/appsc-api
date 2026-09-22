/**
 * webSearch.service.js
 *
 * External web search client using the Tavily Search API.
 * Falls back gracefully on timeout, quota exhaustion, or network failure
 * by returning an empty result set — never throws to the caller.
 *
 * Environment variables:
 *   TAVILY_API_KEY  — required for Tavily Search
 */

const TAVILY_API_URL = "https://api.tavily.com/search";

/**
 * Number of top results to retain from the Tavily response.
 */
const MAX_RESULTS = 5;

/**
 * Request timeout in milliseconds.
 */
const TIMEOUT_MS = 8000;

/**
 * Truncate content snippets to keep prompt size manageable.
 */
const MAX_CONTENT_LENGTH = 600;

/**
 * Perform an external web search using the Tavily API.
 *
 * Returns top 3-5 high-signal results with { title, url, content }.
 * On any failure (network error, timeout, API error) returns [] so that
 * the caller can decide to continue with a fallback instead of crashing.
 *
 * @param {string} queryText
 * @returns {Promise<Array<{ title: string, url: string, content: string }>>}
 */
export const performWebSearch = async (queryText) => {
  if (!queryText || typeof queryText !== "string" || !queryText.trim()) {
    return [];
  }

  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn("[webSearch] TAVILY_API_KEY is not configured. Skipping web search.");
    return [];
  }

  // AbortController for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: queryText.trim(),
        search_depth: "basic",
        topic: "general",
        max_results: MAX_RESULTS,
        include_answer: false,
        include_raw_content: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown error");
      console.error(
        `[webSearch] Tavily API returned ${response.status}: ${errorText}`
      );
      return [];
    }

    const data = await response.json();

    const rawResults = Array.isArray(data?.results) ? data.results : [];

    // Clean and normalise results
    return rawResults
      .filter(
        (r) => r && typeof r.url === "string" && (r.content || r.snippet || r.title)
      )
      .slice(0, MAX_RESULTS)
      .map((r) => ({
        title: (r.title ?? "").trim(),
        url: r.url.trim(),
        content: truncate(
          (r.content ?? r.snippet ?? r.raw_content ?? "").trim(),
          MAX_CONTENT_LENGTH
        ),
      }))
      .filter((r) => r.content.length > 0);
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      console.warn("[webSearch] Tavily request timed out after", TIMEOUT_MS, "ms");
    } else {
      console.error("[webSearch] Unexpected error:", err.message);
    }

    return [];
  }
};

/**
 * Truncate a string to `maxLen` characters, appending '...' if cut.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
const truncate = (str, maxLen) =>
  str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
