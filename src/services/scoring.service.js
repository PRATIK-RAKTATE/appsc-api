import mongoose from "mongoose";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { Question } from "../models/question.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Test } from "../models/test.model.js";

/**
 * Default marks per question when a section does not define them explicitly.
 */
const DEFAULT_MARKS_PER_QUESTION = 1;

/**
 * Build a map of { questionId -> { marksPerQuestion, negativeMarkingCoefficient } }
 * by iterating over all sections of the given test.
 *
 * @param {mongoose.Types.ObjectId} testId
 * @returns {Promise<Map<string, { marksPerQuestion: number, negativeMarkingCoefficient: number }>>}
 */
const buildSectionMarkMap = async (testId) => {
  const sections = await TestSection.find({ testId });
  const map = new Map();

  for (const section of sections) {
    for (const qId of section.questions) {
      map.set(qId.toString(), {
        marksPerQuestion: section.marksPerQuestion ?? DEFAULT_MARKS_PER_QUESTION,
        negativeMarkingCoefficient: section.negativeMarkingCoefficient ?? 0,
      });
    }
  }

  return map;
};

/**
 * Evaluate an exam attempt, calculating score and updating the attempt document.
 *
 * Idempotency: if the attempt is already SUBMITTED, the saved scorecard is returned
 * immediately without recomputing marks.
 *
 * Scoring rules (derived from TestSection settings):
 *   - Correct:     +marksPerQuestion
 *   - Incorrect:   -(marksPerQuestion * negativeMarkingCoefficient)
 *   - Unattempted: 0
 *
 * The final score is allowed to go negative (as is common in competitive exams).
 *
 * @param {string} attemptId
 * @param {string} userId
 * @returns {Promise<{
 *   attemptId: string,
 *   score: number,
 *   totalMarks: number,
 *   correctCount: number,
 *   incorrectCount: number,
 *   unattemptedCount: number,
 *   accuracy: number,
 *   totalTimeSeconds: number,
 *   submittedAt: Date,
 *   idempotent: boolean,
 * }>}
 */
export const evaluateExamAttempt = async (attemptId, userId) => {
  const aId = new mongoose.Types.ObjectId(attemptId);
  const uId = new mongoose.Types.ObjectId(userId);

  const attempt = await ExamAttempt.findOne({ _id: aId, userId: uId });
  if (!attempt) {
    throw new Error("Attempt not found or unauthorized");
  }

  // --- Idempotency guard ---
  if (attempt.status === "SUBMITTED") {
    return {
      attemptId: attempt._id.toString(),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unattemptedCount: attempt.unattemptedCount,
      accuracy: attempt.accuracy,
      totalTimeSeconds: attempt.totalTimeSeconds,
      submittedAt: attempt.submittedAt,
      idempotent: true,
    };
  }

  if (attempt.status === "EXPIRED") {
    throw new Error("Cannot submit an expired attempt");
  }

  // --- Fetch test metadata ---
  const test = await Test.findById(attempt.testId);
  if (!test) {
    throw new Error("Associated test not found");
  }

  // --- Build per-question mark map from sections ---
  const sectionMarkMap = await buildSectionMarkMap(attempt.testId);

  // --- Fetch authoritative correct answers ---
  const questionIds = attempt.responses.map((r) => r.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });

  const questionMap = new Map();
  for (const q of questions) {
    questionMap.set(q._id.toString(), q);
  }

  // --- Grade each response ---
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let totalTimeSeconds = 0;

  for (const response of attempt.responses) {
    const qIdStr = response.questionId.toString();
    const question = questionMap.get(qIdStr);
    const sectionInfo = sectionMarkMap.get(qIdStr) ?? {
      marksPerQuestion: DEFAULT_MARKS_PER_QUESTION,
      negativeMarkingCoefficient: 0,
    };

    totalTimeSeconds += response.timeSpentSeconds ?? 0;

    if (!question) {
      // Question removed from DB after attempt was created — treat as unattempted
      unattemptedCount++;
      continue;
    }

    const { selectedOption } = response;
    const { correctOption } = question;
    const { marksPerQuestion, negativeMarkingCoefficient } = sectionInfo;

    if (selectedOption === null || selectedOption === undefined) {
      // Unattempted
      unattemptedCount++;
    } else if (selectedOption === correctOption) {
      // Correct
      score += marksPerQuestion;
      correctCount++;
    } else {
      // Incorrect — negative marking
      score -= marksPerQuestion * negativeMarkingCoefficient;
      incorrectCount++;
    }
  }

  // Guard against NaN (e.g. all edge cases)
  if (!Number.isFinite(score)) score = 0;

  // Accuracy: percentage of attempted questions answered correctly
  const attempted = correctCount + incorrectCount;
  const accuracy = attempted > 0
    ? Math.round((correctCount / attempted) * 10000) / 100  // 2 d.p.
    : 0;

  const totalMarks = test.totalMarks ?? 0;
  const submittedAt = new Date();

  // --- Persist ---
  await ExamAttempt.findByIdAndUpdate(aId, {
    status: "SUBMITTED",
    submittedAt,
    score,
    totalMarks,
    correctCount,
    incorrectCount,
    unattemptedCount,
    accuracy,
    totalTimeSeconds,
  });

  return {
    attemptId: attempt._id.toString(),
    score,
    totalMarks,
    correctCount,
    incorrectCount,
    unattemptedCount,
    accuracy,
    totalTimeSeconds,
    submittedAt,
    idempotent: false,
  };
};
