import mongoose from "mongoose";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { ExamAttempt } from "../models/examAttempt.model.js";

/**
 * Starts or resumes an exam session for a student.
 */
export const startExamSession = async (userId, testId) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const tId = new mongoose.Types.ObjectId(testId);

  // 1. Check for existing IN_PROGRESS attempt
  const existingAttempt = await ExamAttempt.findOne({
    userId: uId,
    testId: tId,
    status: "IN_PROGRESS",
  });

  if (existingAttempt) {
    if (new Date() < existingAttempt.expiresAt) {
      // Resume session
      return {
        attemptId: existingAttempt._id,
        expiresAt: existingAttempt.expiresAt,
        remainingTimeSeconds: Math.max(0, Math.floor((existingAttempt.expiresAt - new Date()) / 1000)),
        responses: existingAttempt.responses,
        // We still need to provide questions for the UI
        questions: await _getSanitizedQuestions(tId),
      };
    } else {
      // Mark as expired
      existingAttempt.status = "EXPIRED";
      await existingAttempt.save();
      throw new Error("Your previous attempt has expired. You cannot resume this session.");
    }
  }

  // 2. Create new attempt
  const test = await Test.findById(tId);
  if (!test) throw new Error("Test not found");

  const durationMs = test.durationMinutes * 60 * 1000;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + durationMs);

  // Fetch and sanitize questions
  const questions = await _getSanitizedQuestions(tId);

  // Initialize responses
  const responses = questions.map((q) => ({
    questionId: q._id,
    selectedOption: null,
    status: "NOT_VISITED",
    timeSpentSeconds: 0,
  }));

  const attempt = await ExamAttempt.create({
    userId: uId,
    testId: tId,
    startedAt,
    expiresAt,
    responses,
  });

  return {
    attemptId: attempt._id,
    expiresAt: attempt.expiresAt,
    remainingTimeSeconds: durationMs / 1000,
    questions,
    responses: attempt.responses,
  };
};

/**
 * Internal helper to fetch and sanitize questions from all sections of a test.
 */
async function _getSanitizedQuestions(testId) {
  const sections = await TestSection.find({ testId }).sort("order");
  let allQuestions = [];

  for (const section of sections) {
    const questions = await Question.find({ _id: { $in: section.questions } });
    
    // Randomize questions if section config allows
    if (section.randomizeQuestions) {
      allQuestions.push(...questions.sort(() => Math.random() - 0.5));
    } else {
      allQuestions.push(...questions);
    }
  }

  // Sanitize: Strip sensitive fields
  return allQuestions.map((q) => {
    const sanitized = q.toObject();
    delete sanitized.explaination; // Task says explanation
    // If there was a correctOption field, it would be deleted here.
    // In current Question model, there is no correctOption. 
    // I'll assume the task refers to fields that might be added or exist in a real scenario.
    return sanitized;
  });
}

/**
 * Incremental autosave of answers and palette status.
 */
export const autosaveAnswer = async (attemptId, userId, updates) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const aId = new mongoose.Types.ObjectId(attemptId);

  const attempt = await ExamAttempt.findOne({ _id: aId, userId: uId });

  if (!attempt) throw new Error("Attempt not found or unauthorized");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt is no longer in progress");

  // Server-side timer check (5s grace period)
  if (new Date() > new Date(attempt.expiresAt.getTime() + 5000)) {
    attempt.status = "EXPIRED";
    await attempt.save();
    return { expired: true };
  }

  // Payload can be single object or array of updates
  const updateList = Array.isArray(updates) ? updates : [updates];

  for (const update of updateList) {
    const { questionId, selectedOption, status, timeSpentSeconds } = update;
    
    if (!questionId) continue;

    // Atomic update using positional operator $
    await ExamAttempt.updateOne(
      { _id: aId, "responses.questionId": questionId },
      {
        $set: {
          "responses.$.selectedOption": selectedOption,
          "responses.$.status": status,
          "responses.$.timeSpentSeconds": timeSpentSeconds,
        },
      }
    );
  }

  const remainingTimeSeconds = Math.max(0, Math.floor((attempt.expiresAt - new Date()) / 1000));
  
  return {
    success: true,
    remainingTimeSeconds,
  };
};
