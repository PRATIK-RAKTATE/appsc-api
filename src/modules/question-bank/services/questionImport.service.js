import mongoose from "mongoose";
import { parse } from "csv-parse/sync";
import { Subject } from "../models/subject.model.js";
import { Topic } from "../models/topic.model.js";
import { SubTopic } from "../models/subTopic.model.js";
import { Question } from "../models/question.model.js";

const REQUIRED_LANGUAGES = ["en", "te"];
const VALID_OPTION_KEYS = ["A", "B", "C", "D"];

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const validateBilingualField = (field, fieldName, errors) => {
  if (!field || typeof field !== "object") {
    errors.push(`${fieldName} must contain en and te fields`);
    return;
  }

  for (const language of REQUIRED_LANGUAGES) {
    if (
      typeof field[language] !== "string" ||
      field[language].trim().length === 0
    ) {
      errors.push(`${fieldName}.${language} is required`);
    }
  }
};

export const validateQuestion = (question, index = 0) => {
  const errors = [];
  const prefix = `Question ${index + 1}`;

  // IDs
  if (!question.subjectID || !isValidObjectId(question.subjectID)) {
    errors.push(`${prefix}: invalid subjectID`);
  }

  if (!question.topicID || !isValidObjectId(question.topicID)) {
    errors.push(`${prefix}: invalid topicID`);
  }

  if (!question.subTopic || !isValidObjectId(question.subTopic)) {
    errors.push(`${prefix}: invalid subTopic`);
  }

  // Question bilingual validation
  validateBilingualField(question.question, `${prefix}: question`, errors);

  // Explanation bilingual validation
  validateBilingualField(
    question.explaination,
    `${prefix}: explaination`,
    errors,
  );

  // Options
  if (!Array.isArray(question.option)) {
    errors.push(`${prefix}: option must be an array`);
  } else {
    if (question.option.length !== 4) {
      errors.push(`${prefix}: exactly 4 options are required`);
    }

    const keys = question.option.map((option) => option?.key);

    for (const key of keys) {
      if (!VALID_OPTION_KEYS.includes(key)) {
        errors.push(
          `${prefix}: invalid option key "${key}". Allowed keys: A, B, C, D`,
        );
      }
    }

    if (new Set(keys).size !== keys.length) {
      errors.push(`${prefix}: option keys must be unique`);
    }

    for (const option of question.option) {
      if (!option || typeof option !== "object") {
        errors.push(`${prefix}: invalid option format`);
        continue;
      }

      validateBilingualField(
        option.text,
        `${prefix}: option ${option.key} text`,
        errors,
      );

      if (typeof option.weight !== "number" || Number.isNaN(option.weight)) {
        errors.push(`${prefix}: option ${option.key} weight must be a number`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateQuestionBundle = (questions) => {
  if (!Array.isArray(questions)) {
    return {
      valid: false,
      errors: ["Import data must be an array of questions"],
      questions: [],
    };
  }

  const errors = [];

  questions.forEach((question, index) => {
    const result = validateQuestion(question, index);

    if (!result.valid) {
      errors.push(...result.errors);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    questions,
  };
};

export const importQuestionsFromJson = async (questions) => {
  const validation = validateQuestionBundle(questions);

  if (!validation.valid) {
    const error = new Error("Question validation failed");
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }

  const errors = [];

  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];

    const subject = await Subject.findById(question.subjectID);

    if (!subject) {
      errors.push(`Question ${index + 1}: subject not found`);
      continue;
    }

    const topic = await Topic.findOne({
      _id: question.topicID,
      subjectID: question.subjectID,
    });

    if (!topic) {
      errors.push(`Question ${index + 1}: topic does not belong to subject`);
      continue;
    }

    const subTopic = await SubTopic.findOne({
      _id: question.subTopic,
      topicID: question.topicID,
    });

    if (!subTopic) {
      errors.push(`Question ${index + 1}: subTopic does not belong to topic`);
    }
  }

  if (errors.length > 0) {
    const error = new Error("Taxonomy validation failed");
    error.statusCode = 400;
    error.details = errors;
    throw error;
  }

  const insertedQuestions = await Question.insertMany(questions);

  return {
    importedCount: insertedQuestions.length,
    questions: insertedQuestions,
  };
};

export const parseQuestionsCsv = (csvText) => {
  if (!csvText || typeof csvText !== "string") {
    const error = new Error("CSV data is required");
    error.statusCode = 400;
    throw error;
  }

  let records;
  const REQUIRED_CSV_HEADERS = [
    "subjectID",
    "topicID",
    "subTopic",
    "question_en",
    "question_te",
    "option_A_en",
    "option_A_te",
    "option_A_weight",
    "option_B_en",
    "option_B_te",
    "option_B_weight",
    "option_C_en",
    "option_C_te",
    "option_C_weight",
    "option_D_en",
    "option_D_te",
    "option_D_weight",
    "explaination_en",
    "explaination_te",
  ];

  try {
    records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    const csvError = new Error("Invalid CSV format");
    csvError.statusCode = 400;
    csvError.details = [error.message];
    throw csvError;
  }

  if (records.length === 0) {
    const error = new Error("CSV file contains no questions");
    error.statusCode = 400;
    throw error;
  }

  const headers = Object.keys(records[0] || {});

  const missingHeaders = REQUIRED_CSV_HEADERS.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    const error = new Error("Invalid CSV headers");
    error.statusCode = 400;
    error.details = missingHeaders.map(
      (header) => `Missing CSV column: ${header}`,
    );
    throw error;
  }
  const questions = records.map((row) => ({
    subjectID: row.subjectID,
    topicID: row.topicID,
    subTopic: row.subTopic,

    question: {
      en: row.question_en,
      te: row.question_te,
    },

    option: [
      {
        key: "A",
        text: {
          en: row.option_A_en,
          te: row.option_A_te,
        },
        weight: Number(row.option_A_weight),
      },
      {
        key: "B",
        text: {
          en: row.option_B_en,
          te: row.option_B_te,
        },
        weight: Number(row.option_B_weight),
      },
      {
        key: "C",
        text: {
          en: row.option_C_en,
          te: row.option_C_te,
        },
        weight: Number(row.option_C_weight),
      },
      {
        key: "D",
        text: {
          en: row.option_D_en,
          te: row.option_D_te,
        },
        weight: Number(row.option_D_weight),
      },
    ],

    explaination: {
      en: row.explaination_en,
      te: row.explaination_te,
    },
  }));

  const validation = validateQuestionBundle(questions);

  if (!validation.valid) {
    const error = new Error("CSV question validation failed");
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }

  return questions;
};

export const importQuestionsFromCsv = async (csvText) => {
  const questions = parseQuestionsCsv(csvText);

  return importQuestionsFromJson(questions);
};