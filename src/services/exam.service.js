import mongoose from "mongoose";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { TestSubmission, ANSWER_STATUS, SUBMISSION_STATUS } from "../models/testSubmission.model.js";
import { LeaderboardSnapshot } from "../models/leaderboardSnapshot.model.js";
import { Topic } from "../models/topic.model.js";
import { Subject } from "../models/subject.model.js";

/**
 * Starts or resumes an exam session for a student.
 */
export const startExamSession = async (userId, testId) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const tId = new mongoose.Types.ObjectId(testId);

  const existingAttempt = await ExamAttempt.findOne({
    userId: uId,
    testId: tId,
    status: "IN_PROGRESS",
  });

  if (existingAttempt) {
    if (new Date() < existingAttempt.expiresAt) {
      return {
        attemptId: existingAttempt._id,
        expiresAt: existingAttempt.expiresAt,
        remainingTimeSeconds: Math.max(0, Math.floor((existingAttempt.expiresAt - new Date()) / 1000)),
        responses: existingAttempt.responses,
        questions: await _getSanitizedQuestions(tId),
      };
    } else {
      existingAttempt.status = "EXPIRED";
      await existingAttempt.save();
      throw new Error("Your previous attempt has expired. You cannot resume this session.");
    }
  }

  const test = await Test.findById(tId);
  if (!test) throw new Error("Test not found");

  const durationMs = test.durationMinutes * 60 * 1000;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + durationMs);
  const questions = await _getSanitizedQuestions(tId);

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

async function _getSanitizedQuestions(testId) {
  const sections = await TestSection.find({ testId }).sort("order");
  let allQuestions = [];

  for (const section of sections) {
    const questions = await Question.find({ _id: { $in: section.questions } });
    if (section.randomizeQuestions) {
      allQuestions.push(...questions.sort(() => Math.random() - 0.5));
    } else {
      allQuestions.push(...questions);
    }
  }

  return allQuestions.map((q) => {
    const sanitized = q.toObject();
    delete sanitized.explaination;
    delete sanitized.correctOption;
    return sanitized;
  });
}

export const autosaveAnswer = async (attemptId, userId, updates) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const aId = new mongoose.Types.ObjectId(attemptId);

  const attempt = await ExamAttempt.findOne({ _id: aId, userId: uId });

  if (!attempt) throw new Error("Attempt not found or unauthorized");
  if (attempt.status !== "IN_PROGRESS") throw new Error("Attempt is no longer in progress");

  if (new Date() > new Date(attempt.expiresAt.getTime() + 5000)) {
    attempt.status = "EXPIRED";
    await attempt.save();
    return { expired: true };
  }

  const updateList = Array.isArray(updates) ? updates : [updates];

  for (const update of updateList) {
    const { questionId, selectedOption, status, timeSpentSeconds } = update;
    if (!questionId) continue;

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
  return { success: true, remainingTimeSeconds };
};

/**
 * Scores a submitted exam attempt.
 *
 * For each response:
 *   UNATTEMPTED  → 0 marks
 *   CORRECT      → +section.marksPerQuestion
 *   INCORRECT    → -(section.marksPerQuestion × section.negativeMarkingCoefficient)
 *
 * Persists a TestSubmission document and returns the scorecard.
 */
export const submitExam = async (attemptId, userId) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const aId = new mongoose.Types.ObjectId(attemptId);

  const attempt = await ExamAttempt.findOne({ _id: aId, userId: uId });
  if (!attempt) throw new Error("Attempt not found or unauthorized");
  if (attempt.status === "SUBMITTED") throw new Error("Exam already submitted");

  // Mark the attempt as submitted
  attempt.status = "SUBMITTED";
  attempt.submittedAt = new Date();
  await attempt.save();

  // Build a section → question lookup to retrieve marking scheme
  const sections = await TestSection.find({ testId: attempt.testId });
  const questionToSection = new Map();
  for (const section of sections) {
    for (const qId of section.questions) {
      questionToSection.set(qId.toString(), section);
    }
  }

  // Fetch all questions for this attempt
  const questionIds = attempt.responses.map((r) => r.questionId);
  const questions = await Question.find({ _id: { $in: questionIds } });
  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  // Score each response
  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;

  const answers = attempt.responses.map((res) => {
    const q = questionMap.get(res.questionId.toString());
    const section = questionToSection.get(res.questionId.toString());

    const marksPerQuestion = section ? section.marksPerQuestion : 0;
    const negCoeff = section ? section.negativeMarkingCoefficient : 0;

    // Normalise both sides to string for comparison ("A","B","C","D")
    const selected = res.selectedOption !== null && res.selectedOption !== undefined
      ? String(res.selectedOption)
      : null;
    const correct = q ? String(q.correctOption) : null;

    const isUnattempted = selected === null;
    const isCorrect = !isUnattempted && q ? selected === correct : false;
    const isIncorrect = !isUnattempted && !isCorrect;

    let status;
    let marksAwarded = 0;
    let isCorrectFlag = false;

    if (isUnattempted) {
      status = ANSWER_STATUS.UNATTEMPTED;
      marksAwarded = 0;
      unattemptedCount++;
    } else if (isCorrect) {
      status = ANSWER_STATUS.CORRECT;
      marksAwarded = marksPerQuestion;
      isCorrectFlag = true;
      correctCount++;
    } else {
      status = ANSWER_STATUS.INCORRECT;
      marksAwarded = -(marksPerQuestion * negCoeff);
      incorrectCount++;
    }

    totalScore += marksAwarded;

    return {
      questionId: res.questionId,
      selectedOption: res.selectedOption,
      status,
      isCorrect: isCorrectFlag,
      marksAwarded,
    };
  });

  // Round to avoid floating-point drift (e.g. 7.500000001)
  totalScore = Math.round(totalScore * 100) / 100;

  // Persist the TestSubmission — upsert in case of retry
  const submission = await TestSubmission.findOneAndUpdate(
    { studentId: uId, testId: attempt.testId },
    {
      $set: {
        answers,
        score: totalScore,
        correctCount,
        incorrectCount,
        unattemptedCount,
        status: SUBMISSION_STATUS.SUBMITTED,
        submittedAt: attempt.submittedAt,
      },
    },
    { upsert: true, new: true }
  );

  return {
    success: true,
    attemptId: attempt._id,
    submissionId: submission._id,
    scorecard: {
      score: totalScore,
      totalQuestions: answers.length,
      correctCount,
      incorrectCount,
      unattemptedCount,
      accuracyPercentage:
        correctCount + incorrectCount > 0
          ? Math.round((correctCount / (correctCount + incorrectCount)) * 100 * 100) / 100
          : 0,
    },
  };
};

export const getExamReview = async (attemptId, userId) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const aId = new mongoose.Types.ObjectId(attemptId);

  const attempt = await ExamAttempt.findOne({ _id: aId, userId: uId });
  if (!attempt) throw new Error("Attempt not found or unauthorized");

  if (attempt.status === "IN_PROGRESS") {
    throw new Error("Review and analytics are available only after test submission");
  }

  const test = await Test.findById(attempt.testId);
  const sections = await TestSection.find({ testId: attempt.testId });
  
  // Map section settings for easy access
  const sectionSettings = {};
  sections.forEach(s => {
    sectionSettings[s._id] = s;
  });

  const questions = await Question.find({ 
    _id: { $in: attempt.responses.map(r => r.questionId) } 
  }).populate("topicID");

  const questionMap = {};
  questions.forEach(q => {
    questionMap[q._id.toString()] = q;
  });

  const reviewData = attempt.responses.map(res => {
    const q = questionMap[res.questionId.toString()];
    if (!q) return null;

    const selected = res.selectedOption !== null && res.selectedOption !== undefined
      ? String(res.selectedOption)
      : null;
    const correct = String(q.correctOption);

    const isUnattempted = selected === null;
    const isCorrect = !isUnattempted && selected === correct;
    
    let status = "UNATTEMPTED";
    if (!isUnattempted) {
      status = isCorrect ? "CORRECT" : "INCORRECT";
    }

    // Calculate marks using section data
    const section = sections.find(s => s.questions.some(qId => qId.toString() === q._id.toString()));
    const marksPerQ = section ? section.marksPerQuestion : 0;
    const negCoeff = section ? section.negativeMarkingCoefficient : 0;

    let marksObtained = 0;
    if (status === "CORRECT") marksObtained = marksPerQ;
    else if (status === "INCORRECT") marksObtained = -(marksPerQ * negCoeff);
    marksObtained = Math.round(marksObtained * 100) / 100;

    return {
      questionId: q._id,
      questionTextEn: q.question?.en,
      questionTextTe: q.question?.te,
      optionsEn: q.option?.map(o => o.text?.en) || [],
      optionsTe: q.option?.map(o => o.text?.te) || [],
      selectedOption: res.selectedOption,
      studentAnswer: res.selectedOption,
      correctOption: q.correctOption,
      correctKey: q.correctOption,
      correctAnswer: q.correctOption,
      status,
      marksObtained,
      timeSpentSeconds: res.timeSpentSeconds,
      explanationEn: q.explaination?.en || q.explanation?.en || "",
      explanationTe: q.explaination?.te || q.explanation?.te || "",
      explanation: {
        en: q.explaination?.en || q.explanation?.en || "",
        te: q.explaination?.te || q.explanation?.te || "",
      },
      topic: q.topicID?.topicName || "Unknown",
      topicId: q.topicID?._id,
    };
  }).filter(Boolean);

  return {
    success: true,
    attemptId: attempt._id,
    reviewData,
  };
};

export const getExamAnalytics = async (attemptId, userId) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const aId = new mongoose.Types.ObjectId(attemptId);

  const attempt = await ExamAttempt.findOne({ _id: aId, userId: uId });
  if (!attempt) throw new Error("Attempt not found or unauthorized");

  if (attempt.status === "IN_PROGRESS") {
    throw new Error("Review and analytics are available only after test submission");
  }

  const review = await getExamReview(attemptId, userId);
  const data = review.reviewData;

  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  let totalTime = 0;
  let correctTime = 0;
  let incorrectTime = 0;
  let skippedTime = 0;

  const topicStats = {};

  data.forEach(item => {
    totalScore += item.marksObtained;
    totalTime += item.timeSpentSeconds;

    if (item.status === "CORRECT") {
      correctCount++;
      correctTime += item.timeSpentSeconds;
    } else if (item.status === "INCORRECT") {
      incorrectCount++;
      incorrectTime += item.timeSpentSeconds;
    } else {
      skippedCount++;
      skippedTime += item.timeSpentSeconds;
    }

    // Topic breakdown
    const tId = item.topicId ? item.topicId.toString() : "unknown";
    if (!topicStats[tId]) {
      topicStats[tId] = { name: item.topic, total: 0, correct: 0 };
    }
    topicStats[tId].total++;
    if (item.status === "CORRECT") topicStats[tId].correct++;
  });

  const totalQuestions = data.length;
  const attemptedCount = correctCount + incorrectCount;

  const summary = {
    totalScore: Math.round(totalScore * 100) / 100,
    totalQuestions,
    attemptedCount,
    correctCount,
    incorrectCount,
    skippedCount,
    accuracyPercentage: attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0,
  };

  const timeAnalysis = {
    totalTimeSpentSeconds: totalTime,
    avgTimeCorrectSeconds: correctCount > 0 ? correctTime / correctCount : 0,
    avgTimeIncorrectSeconds: incorrectCount > 0 ? incorrectTime / incorrectCount : 0,
    avgTimeSkippedSeconds: skippedCount > 0 ? skippedTime / skippedCount : 0,
  };

  const topicBreakdown = Object.entries(topicStats).map(([id, stats]) => ({
    topicId: id,
    topicName: stats.name,
    totalQuestions: stats.total,
    correctCount: stats.correct,
    accuracyPercentage: (stats.correct / stats.total) * 100,
  }));

  const weakTopics = topicBreakdown
    .filter(t => t.accuracyPercentage < 50)
    .map(t => ({
      topicName: t.topicName,
      accuracy: t.accuracyPercentage,
      recommendation: `Your accuracy in ${t.topicName} is low. We recommend revisiting the core concepts and practicing more questions from this topic.`,
    }));

  return {
    success: true,
    summary,
    timeAnalysis,
    topicBreakdown,
    weakTopics,
  };
};

/**
 * Returns the most recent leaderboard snapshot for a given test.
 * @param {string} testId
 * @param {number} [limit=50] Maximum number of rankings to return
 */
export const getLeaderboard = async (testId, limit = 50) => {
  const tId = new mongoose.Types.ObjectId(testId);

  const snapshot = await LeaderboardSnapshot.findOne({ testId: tId })
    .sort({ snapshotAt: -1 });

  if (!snapshot) {
    return {
      success: true,
      testId,
      snapshotAt: null,
      rankings: [],
      message: "No leaderboard snapshot available yet. Rankings are updated hourly.",
    };
  }

  const rankings = snapshot.rankings.slice(0, limit);

  return {
    success: true,
    testId,
    snapshotAt: snapshot.snapshotAt,
    rankings,
  };
};
