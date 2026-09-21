import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCitationTag,
  formatCitationText,
  parseCitationMarkers,
  replaceCitationMarkers,
  buildInlineCitations,
  attachCitationsToText,
} from "../services/citation.service.js";

describe("Citation Service", () => {
  describe("buildCitationTag", () => {
    it("should build a citation tag with all metadata fields", () => {
      const chunk = {
        chunkId: "64a1b2c3d4e5f6a7b8c9d0e1",
        bookId: "64a1b2c3d4e5f6a7b8c9d0e2",
        chapterId: "64a1b2c3d4e5f6a7b8c9d0e3",
        metadata: {
          bookTitle: "Indian Polity",
          chapterTitle: "Fundamental Rights",
          pageNumber: 145,
          sourceLanguage: "ENGLISH",
        },
      };

      const tag = buildCitationTag(chunk);

      expect(tag).toEqual({
        type: "citation",
        chunkId: "64a1b2c3d4e5f6a7b8c9d0e1",
        bookId: "64a1b2c3d4e5f6a7b8c9d0e2",
        chapterId: "64a1b2c3d4e5f6a7b8c9d0e3",
        bookTitle: "Indian Polity",
        chapterTitle: "Fundamental Rights",
        pageNumber: 145,
        sourceLanguage: "ENGLISH",
        label: "Fundamental Rights, p. 145",
      });
    });

    it("should fall back to chunk title when metadata bookTitle is missing", () => {
      const chunk = {
        chunkId: "64a1b2c3d4e5f6a7b8c9d0e1",
        metadata: {
          chapterTitle: "Directive Principles",
          pageNumber: 200,
        },
        title: "Fallback Book Title",
      };

      const tag = buildCitationTag(chunk);

      expect(tag.bookTitle).toBe("Fallback Book Title");
      expect(tag.label).toBe("Directive Principles, p. 200");
    });

    it("should omit optional fields when missing", () => {
      const chunk = {
        chunkId: "64a1b2c3d4e5f6a7b8c9d0e1",
        metadata: {
          bookTitle: "Economics",
        },
      };

      const tag = buildCitationTag(chunk);

      expect(tag.chapterTitle).toBeNull();
      expect(tag.pageNumber).toBeNull();
      expect(tag.sourceLanguage).toBeNull();
      expect(tag.label).toBe("Economics");
    });

    it("should reject non-number page numbers", () => {
      const chunk = {
        metadata: {
          bookTitle: "Book",
          pageNumber: "145",
        },
      };

      const tag = buildCitationTag(chunk);

      expect(tag.pageNumber).toBeNull();
    });

    it("should reject zero and negative page numbers", () => {
      const chunk = {
        metadata: {
          bookTitle: "Book",
          pageNumber: 0,
        },
      };

      const tag = buildCitationTag(chunk);

      expect(tag.pageNumber).toBeNull();
    });

    it("should throw when chunk is missing", () => {
      expect(() => buildCitationTag(null)).toThrow(
        "Chunk metadata is required to build a citation tag"
      );
    });

    it("should throw when book title is empty", () => {
      const chunk = {
        metadata: {
          bookTitle: "   ",
        },
      };

      expect(() => buildCitationTag(chunk)).toThrow(
        "Book title is required in chunk metadata to build a citation tag"
      );
    });

    it("should handle _id as string chunkId fallback", () => {
      const chunk = {
        _id: "64a1b2c3d4e5f6a7b8c9d0e1",
        metadata: {
          bookTitle: "History",
        },
      };

      const tag = buildCitationTag(chunk);

      expect(tag.chunkId).toBe("64a1b2c3d4e5f6a7b8c9d0e1");
    });
  });

  describe("formatCitationText", () => {
    it("should return label when present", () => {
      const citation = {
        bookTitle: "Polity",
        chapterTitle: "Rights",
        pageNumber: 100,
        label: "Rights, p. 100",
      };

      expect(formatCitationText(citation)).toBe("Rights, p. 100");
    });

    it("should build text from fields when label is missing", () => {
      const citation = {
        bookTitle: "Polity",
        chapterTitle: "Rights",
        pageNumber: 100,
        sourceLanguage: "EN",
      };

      expect(formatCitationText(citation)).toBe("Rights, p. 100");
    });

    it("should return default label for empty citation", () => {
      expect(formatCitationText(null)).toBe("");
      expect(formatCitationText({})).toBe("Source");
    });
  });

  describe("parseCitationMarkers", () => {
    it("should extract citation markers from text", () => {
      const text = "Answer based on [cite:64a1b2c3d4e5f6a7b8c9d0e1] and [cite:64a1b2c3d4e5f6a7b8c9d0e2].";

      const markers = parseCitationMarkers(text);

      expect(markers).toHaveLength(2);
      expect(markers[0]).toEqual({
        raw: "[cite:64a1b2c3d4e5f6a7b8c9d0e1]",
        chunkId: "64a1b2c3d4e5f6a7b8c9d0e1",
        index: 16,
      });
      expect(markers[1]).toEqual({
        raw: "[cite:64a1b2c3d4e5f6a7b8c9d0e2]",
        chunkId: "64a1b2c3d4e5f6a7b8c9d0e2",
        index: 52,
      });
    });

    it("should return empty array for text without markers", () => {
      expect(parseCitationMarkers("No citations here.")).toEqual([]);
    });

    it("should return empty array for invalid input", () => {
      expect(parseCitationMarkers(null)).toEqual([]);
      expect(parseCitationMarkers(undefined)).toEqual([]);
      expect(parseCitationMarkers("")).toEqual([]);
    });
  });

  describe("replaceCitationMarkers", () => {
    it("should replace markers with citation labels", () => {
      const text = "See [cite:chunk-1] for details.";
      const citationMap = {
        "chunk-1": { label: "Indian Polity, p. 50" },
      };

      expect(replaceCitationMarkers(text, citationMap)).toBe(
        "See Indian Polity, p. 50 for details."
      );
    });

    it("should preserve markers with no matching citation", () => {
      const text = "See [cite:unknown] for details.";
      const citationMap = {};

      expect(replaceCitationMarkers(text, citationMap)).toBe(
        "See [cite:unknown] for details."
      );
    });

    it("should handle invalid input gracefully", () => {
      expect(replaceCitationMarkers(null, {})).toBe("");
      expect(replaceCitationMarkers(undefined, {})).toBe("");
    });
  });

  describe("buildInlineCitations", () => {
    it("should build a citation map from chunks", () => {
      const chunks = [
        {
          chunkId: "c1",
          bookId: "b1",
          chapterId: "ch1",
          metadata: { bookTitle: "Book A", chapterTitle: "Chapter 1", pageNumber: 10 },
        },
        {
          chunkId: "c2",
          bookId: "b1",
          chapterId: "ch2",
          metadata: { bookTitle: "Book A", chapterTitle: "Chapter 2" },
        },
      ];

      const citations = buildInlineCitations(chunks);

      expect(Object.keys(citations)).toHaveLength(2);
      expect(citations["c1"].label).toBe("Chapter 1, p. 10");
      expect(citations["c2"].label).toBe("Chapter 2");
    });

    it("should skip invalid chunks silently", () => {
      const chunks = [
        { metadata: { bookTitle: "" } },
        null,
        undefined,
      ];

      const citations = buildInlineCitations(chunks);

      expect(Object.keys(citations)).toHaveLength(0);
    });

    it("should return empty object for non-array input", () => {
      expect(buildInlineCitations(null)).toEqual({});
      expect(buildInlineCitations("not-an-array")).toEqual({});
    });
  });

  describe("attachCitationsToText", () => {
    it("should append citation markers to text when chunks are provided", () => {
      const text = "India is a sovereign nation.";
      const chunks = [
        {
          chunkId: "c1",
          bookId: "b1",
          chapterId: "ch1",
          metadata: { bookTitle: "Polity", chapterTitle: "Preamble", pageNumber: 5 },
        },
      ];

      const result = attachCitationsToText(text, chunks);

      expect(result.text).toContain("[cite:c1]");
      expect(result.citations["c1"].bookTitle).toBe("Polity");
    });

    it("should return original text and empty citations when no chunks", () => {
      const text = "Some answer text.";
      const result = attachCitationsToText(text, []);

      expect(result.text).toBe("Some answer text.");
      expect(Object.keys(result.citations)).toHaveLength(0);
    });

    it("should handle invalid input gracefully", () => {
      expect(attachCitationsToText(null, [])).toEqual({ text: "", citations: {} });
      expect(attachCitationsToText(undefined, [])).toEqual({ text: "", citations: {} });
    });
  });
});
