import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from "../services/question.service.js";
import {
  importQuestionsFromJson,
  importQuestionsFromCsv,
} from "../services/questionImport.service.js";

export const createQuestionController = async (req, res) => {
  try {
    const { subjectID, topicID, subTopic, question, option, explaination } =
      req.body;

    if (
      !subjectID ||
      !topicID ||
      !subTopic ||
      !question ||
      !option ||
      !explaination
    ) {
      return res.status(400).json({
        success: false,
        message:
          "subjectID, topicID, subTopic, question, option and explaination are required",
      });
    }

    const createdQuestion = await createQuestion(req.body);

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: createdQuestion,
    });
  } catch (error) {
    const relationshipErrors = [
      "Subject not found",
      "Topic not found",
      "SubTopic not found",
      "Topic does not belong to subject",
      "SubTopic does not belong to topic",
    ];

    const statusCode = relationshipErrors.includes(error.message) ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const getQuestionsController = async (req, res) => {
  try {
    const questions = await getQuestions(req.query);

    return res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getQuestionByIdController = async (req, res) => {
  try {
    const question = await getQuestionById(req.params.id);

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    const statusCode = error.message === "Question not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateQuestionController = async (req, res) => {
  try {
    const question = await updateQuestion(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    const statusCode = error.message === "Question not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteQuestionController = async (req, res) => {
  try {
    const question = await deleteQuestion(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: question,
    });
  } catch (error) {
    const statusCode = error.message === "Question not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const importQuestionsJsonController = async (req, res) => {
  try {
    const questions = req.body?.questions;

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message: "questions must be an array",
      });
    }

    const result = await importQuestionsFromJson(questions);

    return res.status(201).json({
      success: true,
      message: "Questions imported successfully",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to import questions",
      errors: error.details || [],
    });
  }
};

export const importQuestionsCsvController = async (req, res) => {
  try {
    const csvText = req.body?.csv;

    if (!csvText) {
      return res.status(400).json({
        success: false,
        message: "csv is required",
      });
    }

    const result = await importQuestionsFromCsv(csvText);

    return res.status(201).json({
      success: true,
      message: "Questions imported successfully",
      data: {
        importedCount: result.importedCount,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to import questions",
      errors: error.details || [],
    });
  }
};