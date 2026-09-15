import mongoose from "mongoose";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { Topic } from "../models/topic.model.js";

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

export const submitExam = async (attemptId, userId) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const aId = new mongoose.Types.ObjectId(attemptId);

  const attempt = await ExamAttempt.findOne({ _id: aId, userId: uId });
  if (!attempt) throw new Error("Attempt not found or unauthorized");

  attempt.status = "SUBMITTED";
  attempt.submittedAt = new Date();
  await attempt.save();

  return { success: true, attemptId: attempt._id };
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

    const isCorrect = res.selectedOption === q.correctOption;
    const isUnattempted = res.selectedOption === null;
    
    let status = "UNATTEMPTED";
    if (!isUnattempted) {
      status = isCorrect ? "CORRECT" : "INCORRECT";
    }

    // Calculate marks
    // We need the section this question belongs to
    const section = sections.find(s => s.questions.includes(q._id));
    const marksPerQ = section ? section.marksPerQuestion : 0;
    const negCoeff = section ? section.negativeMarkingCoefficient : 0;

    let marksObtained = 0;
    if (status === "CORRECT") marksObtained = marksPerQ;
    else if (status === "INCORRECT") marksObtained = - (marksPerQ * negCoeff);

    return {
      questionId: q._id,
      questionTextEn: q.question.en,
      questionTextTe: q.question.te,
      optionsEn: q.option.map(o => o.text.en),
      optionsTe: q.option.map(o => o.text.te),
      selectedOption: res.selectedOption,
      correctOption: q.correctOption,
      status,
      marksObtained,
      timeSpentSeconds: res.timeSpentSeconds,
      explanationEn: q.explaination.en,
      explanationTe: q.explaination.te,
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
    const tId = item.topicId.toString();
    if (!topicStats[tId]) {
      topicStats[tId] = { name: item.topic, total: 0, correct: 0 };
    }
    topicStats[tId].total++;
    if (item.status === "CORRECT") topicStats[tId].correct++;
  });

  const totalQuestions = data.length;
  const attemptedCount = correctCount + incorrectCount;

  const summary = {
    totalScore,
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
