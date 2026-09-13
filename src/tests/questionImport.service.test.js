import { describe, expect, it } from "vitest";
import {
  validateQuestion,
  validateQuestionBundle,
  parseQuestionsCsv,
} from "../services/questionImport.service.js";

const validQuestion = {
  subjectID: "507f1f77bcf86cd799439011",
  topicID: "507f1f77bcf86cd799439012",
  subTopic: "507f1f77bcf86cd799439013",

  question: {
    en: "Which Article deals with equality?",
    te: "సమానత్వానికి సంబంధించిన అధికరణం ఏది?",
  },

  option: [
    {
      key: "A",
      text: {
        en: "Article 14",
        te: "ఆర్టికల్ 14",
      },
      weight: 1,
    },
    {
      key: "B",
      text: {
        en: "Article 19",
        te: "ఆర్టికల్ 19",
      },
      weight: 0,
    },
    {
      key: "C",
      text: {
        en: "Article 21",
        te: "ఆర్టికల్ 21",
      },
      weight: 0,
    },
    {
      key: "D",
      text: {
        en: "Article 32",
        te: "ఆర్టికల్ 32",
      },
      weight: 0,
    },
  ],

  explaination: {
    en: "Article 14 deals with equality before law.",
    te: "ఆర్టికల్ 14 చట్టం ముందు సమానత్వానికి సంబంధించినది.",
  },
};

describe("Question Import Parser", () => {
  it("should validate a correct question", () => {
    const result = validateQuestion(validQuestion);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject missing Telugu question", () => {
    const question = structuredClone(validQuestion);

    question.question.te = "";

    const result = validateQuestion(question);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Question 1: question.te is required");
  });

  it("should reject invalid option key", () => {
    const question = structuredClone(validQuestion);

    question.option[0].key = "E";

    const result = validateQuestion(question);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Question 1: invalid option key "E". Allowed keys: A, B, C, D',
    );
  });

  it("should reject less than four options", () => {
    const question = structuredClone(validQuestion);

    question.option.pop();

    const result = validateQuestion(question);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Question 1: exactly 4 options are required",
    );
  });

  it("should reject duplicate option keys", () => {
    const question = structuredClone(validQuestion);

    question.option[1].key = "A";

    const result = validateQuestion(question);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Question 1: option keys must be unique");
  });

  it("should reject invalid subjectID", () => {
    const question = structuredClone(validQuestion);

    question.subjectID = "invalid-id";

    const result = validateQuestion(question);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Question 1: invalid subjectID");
  });

  it("should validate a question bundle", () => {
    const result = validateQuestionBundle([validQuestion, validQuestion]);

    expect(result.valid).toBe(true);
    expect(result.questions).toHaveLength(2);
  });

  it("should reject non-array import data", () => {
    const result = validateQuestionBundle({ question: validQuestion });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Import data must be an array of questions",
    );
  });
});

it("should parse valid CSV question", () => {
  const csv = `
subjectID,topicID,subTopic,question_en,question_te,option_A_en,option_A_te,option_A_weight,option_B_en,option_B_te,option_B_weight,option_C_en,option_C_te,option_C_weight,option_D_en,option_D_te,option_D_weight,explaination_en,explaination_te
665abc123456789012345678,665def123456789012345678,665fed123456789012345678,What is Node.js?,Node.js అంటే ఏమిటి?,Runtime,రన్‌టైమ్,1,Database,డేటాబేస్,0,Framework,ఫ్రేమ్‌వర్క్,0,Language,భాష,0,JavaScript runtime,JavaScript runtime
`;

  const result = parseQuestionsCsv(csv);

  expect(result).toHaveLength(1);
  expect(result[0].question.en).toBe("What is Node.js?");
  expect(result[0].question.te).toBe("Node.js అంటే ఏమిటి?");
  expect(result[0].option).toHaveLength(4);
});

it("should reject invalid CSV data", () => {
  expect(() => parseQuestionsCsv("invalid,csv,data")).toThrow();
});

it("should reject CSV with missing Telugu question", () => {
  const csv = `
subjectID,topicID,subTopic,question_en,question_te,option_A_en,option_A_te,option_A_weight,option_B_en,option_B_te,option_B_weight,option_C_en,option_C_te,option_C_weight,option_D_en,option_D_te,option_D_weight,explaination_en,explaination_te
665abc123456789012345678,665def123456789012345678,665fed123456789012345678,What is Node.js?,,Runtime,రన్‌టైమ్,1,Database,డేటాబేస్,0,Framework,ఫ్రేమ్‌వర్క్,0,Language,భాష,0,JavaScript runtime,JavaScript runtime
`;

  expect(() => parseQuestionsCsv(csv)).toThrow(
    "CSV question validation failed",
  );
});

it("should reject empty CSV", () => {
  expect(() => parseQuestionsCsv("")).toThrow("CSV data is required");
});

it("should reject CSV with no questions", () => {
  const csv = `
subjectID,topicID,subTopic,question_en,question_te
`;

  expect(() => parseQuestionsCsv(csv)).toThrow(
    "CSV file contains no questions",
  );
});

it("should reject CSV with missing required headers", () => {
  const csv = `
subjectID,topicID,subTopic,question_en
1,2,3,What is Node.js?
`;

  expect(() => parseQuestionsCsv(csv)).toThrow("Invalid CSV headers");
});