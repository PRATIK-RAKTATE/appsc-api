const DEFAULT_CITATION_LABEL = "Source";

const sanitize = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
};

export const buildCitationTag = (chunk) => {
  if (!chunk || typeof chunk !== "object") {
    throw new Error("Chunk metadata is required to build a citation tag");
  }

  const metadata = chunk.metadata && typeof chunk.metadata === "object" ? chunk.metadata : {};
  const bookTitle = sanitize(metadata.bookTitle || chunk.title || "");
  const chapterTitle = sanitize(metadata.chapterTitle || "");
  const pageNumber =
    metadata.pageNumber != null && typeof metadata.pageNumber === "number"
      ? metadata.pageNumber
      : null;
  const sourceLanguage = sanitize(metadata.sourceLanguage || "");

  if (!bookTitle) {
    throw new Error("Book title is required in chunk metadata to build a citation tag");
  }

  const parts = [];

  if (chapterTitle) {
    parts.push(chapterTitle);
  }

  if (pageNumber && Number.isInteger(pageNumber) && pageNumber > 0) {
    parts.push(`p. ${pageNumber}`);
  }

  const citationLabel = parts.length ? parts.join(", ") : bookTitle;

  const tag = {
    type: "citation",
    chunkId: chunk.chunkId || chunk._id?.toString() || null,
    bookId: chunk.bookId?.toString() || null,
    chapterId: chunk.chapterId?.toString() || null,
    bookTitle,
    chapterTitle: chapterTitle || null,
    pageNumber: pageNumber && Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : null,
    sourceLanguage: sourceLanguage || null,
    label: citationLabel,
  };

  return tag;
};

export const formatCitationText = (citation) => {
  if (!citation || typeof citation !== "object") {
    return "";
  }

  if (citation.label) {
    return citation.label;
  }

  const parts = [];

  if (citation.chapterTitle) {
    parts.push(citation.chapterTitle);
  }

  if (citation.pageNumber && Number.isInteger(citation.pageNumber) && citation.pageNumber > 0) {
    parts.push(`p. ${citation.pageNumber}`);
  }

  return parts.length ? parts.join(", ") : DEFAULT_CITATION_LABEL;
};

const CITATION_MARKER_PATTERN = /\[cite:([^\]]+)\]/gi;

const createCitationMarkerRegex = () =>
  new RegExp(CITATION_MARKER_PATTERN.source, CITATION_MARKER_PATTERN.flags);

export const parseCitationMarkers = (text) => {
  if (!text || typeof text !== "string") {
    return [];
  }

  const markers = [];
  let match;
  const regex = createCitationMarkerRegex();

  while ((match = regex.exec(text)) !== null) {
    markers.push({
      raw: match[0],
      chunkId: match[1],
      index: match.index,
    });
  }

  return markers;
};

export const replaceCitationMarkers = (text, citationMap) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  const map = citationMap && typeof citationMap === "object" ? citationMap : {};

  return text.replace(createCitationMarkerRegex(), (match, chunkId) => {
    const citation = map[chunkId];
    if (citation && typeof citation.label === "string") {
      return citation.label;
    }
    return match;
  });
};

export const buildInlineCitations = (chunks) => {
  if (!Array.isArray(chunks)) {
    return {};
  }

  const citationMap = {};

  for (const chunk of chunks) {
    try {
      const tag = buildCitationTag(chunk);
      const key = tag.chunkId || `${tag.bookId}-${tag.chapterId}-${tag.pageNumber || ""}`.trim();
      if (key) {
        citationMap[key] = tag;
      }
    } catch {
      continue;
    }
  }

  return citationMap;
};

export const attachCitationsToText = (text, chunks) => {
  if (!text || typeof text !== "string") {
    return { text: "", citations: {} };
  }

  const citations = buildInlineCitations(chunks);
  const citationEntries = Object.values(citations);

  if (!citationEntries.length) {
    return { text, citations: {} };
  }

  const markers = citationEntries.map((c, i) => `[cite:${c.chunkId || `ref-${i}`}]`).join(" ");
  const citationMap = {};

  for (const c of citationEntries) {
    citationMap[c.chunkId || `ref-${citationEntries.indexOf(c)}`] = c;
  }

  const citedText = `${text}\n\n${markers}`;

  return {
    text: citedText,
    citations: citationMap,
  };
};
