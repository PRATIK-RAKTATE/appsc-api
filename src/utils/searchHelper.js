/**
 * Generates a text snippet around the first occurrence of a keyword.
 * @param {string} text - The full text content.
 * @param {string} keyword - The keyword to highlight.
 * @param {number} windowSize - Number of characters to include around the keyword.
 * @returns {string} - The snippet with <mark> tags.
 */
export const generateSnippet = (text, keyword, windowSize = 30) => {
  if (!text || !keyword) return "";

  // Escape regex special characters
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedKeyword, "gi");
  const match = regex.exec(text);

  if (!match) return "";

  const start = Math.max(0, match.index - windowSize);
  const end = Math.min(text.length, match.index + match[0].length + windowSize);

  let snippet = text.substring(start, end);

  // Highlight the keyword in the snippet
  snippet = snippet.replace(regex, (matched) => `<mark>${matched}</mark>`);

  // Add ellipses if truncated
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
};
