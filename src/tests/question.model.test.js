import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import  { Question }  from "../models/question.model.js";

describe("Question Schema", () => {
  const validQuestion = {
    subjectID: new mongoose.Types.ObjectId(),
    topicID: new mongoose.Types.ObjectId(),
    subTopic: new mongoose.Types.ObjectId(),

    question: {
      en: "What is the capital of India?",
      te: "భారతదేశ రాజధాని ఏది?",
    },

    option: [
      {
        key: "A",
        text: {
          en: "Mumbai",
          te: "ముంబై",
        },
        weight: 0,
      },
      {
        key: "B",
        text: {
          en: "New Delhi",
          te: "న్యూఢిల్లీ",
        },
        weight: 1,
      },
      {
        key: "C",
        text: {
          en: "Chennai",
          te: "చెన్నై",
        },
        weight: 0,
      },
      {
        key: "D",
        text: {
          en: "Kolkata",
          te: "కోల్‌కతా",
        },
        weight: 0,
      },
    ],

    explaination: {
      en: "New Delhi is the capital of India.",
      te: "న్యూఢిల్లీ భారతదేశ రాజధాని.",
    },
  };

  it("should create a valid question", () => {
    const question = new Question(validQuestion);

    const error = question.validateSync();

    expect(error).toBeUndefined();
  });

  it("should require subjectID", () => {
    const question = new Question({
      ...validQuestion,
      subjectID: undefined,
    });

    const error = question.validateSync();

    expect(error.errors.subjectID).toBeDefined();
  });

  it("should require topicID", () => {
    const question = new Question({
      ...validQuestion,
      topicID: undefined,
    });

    const error = question.validateSync();

    expect(error.errors.topicID).toBeDefined();
  });

  it("should require subTopic", () => {
    const question = new Question({
      ...validQuestion,
      subTopic: undefined,
    });

    const error = question.validateSync();

    expect(error.errors.subTopic).toBeDefined();
  });

  it("should require question", () => {
    const question = new Question({
      ...validQuestion,
      question: undefined,
    });

    const error = question.validateSync();

    expect(error.errors.question).toBeDefined();
  });

  it("should require explaination", () => {
    const question = new Question({
      ...validQuestion,
      explaination: undefined,
    });

    const error = question.validateSync();

    expect(error.errors.explaination).toBeDefined();
  });

  it("should require English question text", () => {
    const question = new Question({
      ...validQuestion,
      question: {
        te: "భారతదేశ రాజధాని ఏది?",
      },
    });

    const error = question.validateSync();

    expect(error.errors["question.en"]).toBeDefined();
  });

  it("should require Telugu question text", () => {
    const question = new Question({
      ...validQuestion,
      question: {
        en: "What is the capital of India?",
      },
    });

    const error = question.validateSync();

    expect(error.errors["question.te"]).toBeDefined();
  });

  it("should require exactly 4 options", () => {
    const question = new Question({
      ...validQuestion,
      option: validQuestion.option.slice(0, 3),
    });

    const error = question.validateSync();

    expect(error.errors.option).toBeDefined();
    expect(error.errors.option.message).toBe(
      "A question must have exactly 4 options",
    );
  });

  it("should reject more than 4 options", () => {
    const question = new Question({
      ...validQuestion,
      option: [
        ...validQuestion.option,
        {
          key: "A",
          text: {
            en: "Extra option",
            te: "అదనపు ఎంపిక",
          },
          weight: 0,
        },
      ],
    });

    const error = question.validateSync();

    expect(error.errors.option).toBeDefined();
  });

  it("should allow only A, B, C, or D as option keys", () => {
    const question = new Question({
      ...validQuestion,
      option: validQuestion.option.map((option, index) =>
        index === 0 ? { ...option, key: "E" } : option,
      ),
    });

    const error = question.validateSync();

    expect(error.errors["option.0.key"]).toBeDefined();
  });

  it("should require option key", () => {
    const options = [...validQuestion.option];

    options[0] = {
      text: {
        en: "Mumbai",
        te: "ముంబై",
      },
      weight: 0,
    };

    const question = new Question({
      ...validQuestion,
      option: options,
    });

    const error = question.validateSync();

    expect(error.errors["option.0.key"]).toBeDefined();
  });

  it("should require option text", () => {
    const options = [...validQuestion.option];

    options[0] = {
      key: "A",
      weight: 0,
    };

    const question = new Question({
      ...validQuestion,
      option: options,
    });

    const error = question.validateSync();

    expect(error.errors["option.0.text"]).toBeDefined();
  });

  it("should require option weight", () => {
    const options = [...validQuestion.option];

    options[0] = {
      key: "A",
      text: {
        en: "Mumbai",
        te: "ముంబై",
      },
    };

    const question = new Question({
      ...validQuestion,
      option: options,
    });

    const error = question.validateSync();

    expect(error.errors["option.0.weight"]).toBeDefined();
  });

  it("should require English option text", () => {
    const options = [...validQuestion.option];

    options[0] = {
      key: "A",
      text: {
        te: "ముంబై",
      },
      weight: 0,
    };

    const question = new Question({
      ...validQuestion,
      option: options,
    });

    const error = question.validateSync();

    expect(error.errors["option.0.text.en"]).toBeDefined();
  });

  it("should require Telugu option text", () => {
    const options = [...validQuestion.option];

    options[0] = {
      key: "A",
      text: {
        en: "Mumbai",
      },
      weight: 0,
    };

    const question = new Question({
      ...validQuestion,
      option: options,
    });

    const error = question.validateSync();

    expect(error.errors["option.0.text.te"]).toBeDefined();
  });

  it("should require English explanation", () => {
    const question = new Question({
      ...validQuestion,
      explaination: {
        te: "న్యూఢిల్లీ భారతదేశ రాజధాని.",
      },
    });

    const error = question.validateSync();

    expect(error.errors["explaination.en"]).toBeDefined();
  });

  it("should require Telugu explanation", () => {
    const question = new Question({
      ...validQuestion,
      explaination: {
        en: "New Delhi is the capital of India.",
      },
    });

    const error = question.validateSync();

    expect(error.errors["explaination.te"]).toBeDefined();
  });

  it("should have createdAt and updatedAt timestamp fields", () => {
    expect(Question.schema.path("createdAt")).toBeDefined();
    expect(Question.schema.path("updatedAt")).toBeDefined();
  });

  it("should use the Question model", () => {
    expect(Question.modelName).toBe("Question");
  });
});
