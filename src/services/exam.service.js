import mongoose from "mongoose";
import { Test } from "../models/test.model.js";
import { TestSection } from "../models/testSection.model.js";
import { Question } from "../models/question.model.js";
import { ExamAttempt } from "../models/examAttempt.model.js";
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

  // Aggregate historical submitted attempts for longitudinal topic mastery and weak topics
  const longitudinal = await getLongitudinalAnalytics(userId);

  return {
    success: true,
    summary,
    timeAnalysis,
    topicBreakdown,
    topicMastery: longitudinal.topicMastery,
    weakTopics: longitudinal.weakTopics,
    revisionRecommendations: longitudinal.revisionRecommendations,
  };
};

/**
 * Longitudinal analytics aggregating a student's historical submitted attempts.
 * Computes topic mastery percentage, separate average time for correct/incorrect questions,
 * and diagnoses weak topics with revision recommendations.
 */
export const getLongitudinalAnalytics = async (userId, options = {}) => {
  const uId = new mongoose.Types.ObjectId(userId);
  const threshold = typeof options.threshold === "number"
    ? options.threshold
    : !isNaN(Number(options.threshold)) && options.threshold !== "" && options.threshold !== null && options.threshold !== undefined
      ? Number(options.threshold)
      : 50;

  const filter = {
    userId: uId,
    status: "SUBMITTED",
  };

  if (options.testId && mongoose.Types.ObjectId.isValid(options.testId)) {
    filter.testId = new mongoose.Types.ObjectId(options.testId);
  }

  if (options.startDate || options.endDate) {
    filter.submittedAt = {};
    if (options.startDate) filter.submittedAt.$gte = new Date(options.startDate);
    if (options.endDate) filter.submittedAt.$lte = new Date(options.endDate);
  }

  const attempts = await ExamAttempt.find(filter).sort({ submittedAt: -1 });

  if (!attempts || attempts.length === 0) {
    return {
      success: true,
      totalAttempts: 0,
      summary: {
        totalAttempts: 0,
        totalQuestions: 0,
        attemptedCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        skippedCount: 0,
        accuracyPercentage: 0,
        masteryPercentage: 0,
      },
      timeAnalysis: {
        totalTimeSpentSeconds: 0,
        avgTimeCorrectSeconds: 0,
        avgTimeIncorrectSeconds: 0,
        avgTimeSkippedSeconds: 0,
        avgTimePerQuestionSeconds: 0,
      },
      topicMastery: [],
      weakTopics: [],
      revisionRecommendations: [],
      message: "No submitted exam attempts found.",
    };
  }

  // Collect all unique question IDs
  const allQuestionIds = new Set();
  attempts.forEach(attempt => {
    (attempt.responses || []).forEach(r => {
      if (r.questionId) {
        allQuestionIds.add(r.questionId.toString());
      }
    });
  });

  const questionQuery = { _id: { $in: Array.from(allQuestionIds) } };
  if (options.subjectId && mongoose.Types.ObjectId.isValid(options.subjectId)) {
    questionQuery.subjectID = new mongoose.Types.ObjectId(options.subjectId);
  }

  const questions = await Question.find(questionQuery)
    .populate("topicID");

  const questionMap = new Map();
  questions.forEach(q => {
    questionMap.set(q._id.toString(), q);
  });

  let totalQuestions = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  let totalTimeSpent = 0;
  let correctTime = 0;
  let incorrectTime = 0;
  let skippedTime = 0;

  const topicMap = new Map();

  for (const attempt of attempts) {
    for (const res of attempt.responses || []) {
      const q = questionMap.get(res.questionId?.toString());
      if (!q) continue;

      totalQuestions++;
      const timeSpent = typeof res.timeSpentSeconds === "number" && res.timeSpentSeconds >= 0 ? res.timeSpentSeconds : 0;
      totalTimeSpent += timeSpent;

      const isUnattempted = res.selectedOption === null || res.selectedOption === undefined;
      const isCorrect = !isUnattempted && res.selectedOption === q.correctOption;
      const isIncorrect = !isUnattempted && !isCorrect;

      if (isCorrect) {
        correctCount++;
        correctTime += timeSpent;
      } else if (isIncorrect) {
        incorrectCount++;
        incorrectTime += timeSpent;
      } else {
        skippedCount++;
        skippedTime += timeSpent;
      }

      const topicId = q.topicID?._id ? q.topicID._id.toString() : (q.topicID?.toString() || "unknown");
      const topicName = q.topicID?.topicName || q.topicID?.name || "Unknown Topic";
      const subjectId = q.subjectID?._id ? q.subjectID._id.toString() : (q.subjectID?.toString() || null);
      const subjectName = q.subjectID?.subjectName || q.subjectID?.name || null;

      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, {
          topicId,
          topicName,
          subjectId,
          subjectName,
          totalQuestions: 0,
          attemptedCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          skippedCount: 0,
          totalTimeSpentSeconds: 0,
          correctTime: 0,
          incorrectTime: 0,
          skippedTime: 0,
        });
      }

      const tStats = topicMap.get(topicId);
      tStats.totalQuestions++;
      tStats.totalTimeSpentSeconds += timeSpent;

      if (isCorrect) {
        tStats.attemptedCount++;
        tStats.correctCount++;
        tStats.correctTime += timeSpent;
      } else if (isIncorrect) {
        tStats.attemptedCount++;
        tStats.incorrectCount++;
        tStats.incorrectTime += timeSpent;
      } else {
        tStats.skippedCount++;
        tStats.skippedTime += timeSpent;
      }
    }
  }

  const attemptedCount = correctCount + incorrectCount;
  const accuracyPercentage = attemptedCount > 0
    ? Math.round(((correctCount / attemptedCount) * 100) * 100) / 100
    : 0;
  const masteryPercentage = totalQuestions > 0
    ? Math.round(((correctCount / totalQuestions) * 100) * 100) / 100
    : 0;

  const avgTimeCorrectSeconds = correctCount > 0
    ? Math.round((correctTime / correctCount) * 100) / 100
    : 0;
  const avgTimeIncorrectSeconds = incorrectCount > 0
    ? Math.round((incorrectTime / incorrectCount) * 100) / 100
    : 0;
  const avgTimeSkippedSeconds = skippedCount > 0
    ? Math.round((skippedTime / skippedCount) * 100) / 100
    : 0;
  const avgTimePerQuestionSeconds = totalQuestions > 0
    ? Math.round((totalTimeSpent / totalQuestions) * 100) / 100
    : 0;

  const topicMastery = Array.from(topicMap.values()).map(t => {
    const tAccuracy = t.attemptedCount > 0
      ? Math.round(((t.correctCount / t.attemptedCount) * 100) * 100) / 100
      : 0;
    const tMastery = t.totalQuestions > 0
      ? Math.round(((t.correctCount / t.totalQuestions) * 100) * 100) / 100
      : 0;
    const tAvgCorrect = t.correctCount > 0
      ? Math.round((t.correctTime / t.correctCount) * 100) / 100
      : 0;
    const tAvgIncorrect = t.incorrectCount > 0
      ? Math.round((t.incorrectTime / t.incorrectCount) * 100) / 100
      : 0;

    let status = "STRONG";
    if (tAccuracy < threshold) {
      status = "WEAK";
    } else if (tAccuracy < 75) {
      status = "MODERATE";
    }

    return {
      topicId: t.topicId,
      topicName: t.topicName,
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      totalQuestions: t.totalQuestions,
      attemptedCount: t.attemptedCount,
      correctCount: t.correctCount,
      incorrectCount: t.incorrectCount,
      skippedCount: t.skippedCount,
      accuracyPercentage: tAccuracy,
      masteryPercentage: tMastery,
      avgTimeCorrectSeconds: tAvgCorrect,
      avgTimeIncorrectSeconds: tAvgIncorrect,
      totalTimeSpentSeconds: t.totalTimeSpentSeconds,
      status,
    };
  });

  // Sort topicMastery: lowest accuracy first
  topicMastery.sort((a, b) => a.accuracyPercentage - b.accuracyPercentage);

  const weakTopics = topicMastery
    .filter(t => t.accuracyPercentage < threshold)
    .map(t => {
      let recommendation = `Your accuracy in ${t.topicName} is ${t.accuracyPercentage}%. We recommend revisiting the core concepts and practicing more questions from this topic.`;
      if (t.avgTimeIncorrectSeconds > 0 && t.avgTimeCorrectSeconds > 0 && t.avgTimeIncorrectSeconds > t.avgTimeCorrectSeconds * 1.5) {
        recommendation += ` You are spending significant time (${t.avgTimeIncorrectSeconds}s avg) on questions you get wrong; consider strengthening foundational concepts before tackling complex questions.`;
      } else if (t.skippedCount > t.attemptedCount) {
        recommendation += ` A high number of questions in this topic were skipped (${t.skippedCount}/${t.totalQuestions}). Start with basic practice sets to build confidence.`;
      }

      return {
        topicId: t.topicId,
        topicName: t.topicName,
        subjectId: t.subjectId,
        subjectName: t.subjectName,
        accuracy: t.accuracyPercentage,
        accuracyPercentage: t.accuracyPercentage,
        masteryPercentage: t.masteryPercentage,
        totalQuestions: t.totalQuestions,
        correctCount: t.correctCount,
        incorrectCount: t.incorrectCount,
        skippedCount: t.skippedCount,
        avgTimeCorrectSeconds: t.avgTimeCorrectSeconds,
        avgTimeIncorrectSeconds: t.avgTimeIncorrectSeconds,
        status: t.status,
        recommendation,
      };
    });

  const revisionRecommendations = weakTopics.map(wt => ({
    topicId: wt.topicId,
    topicName: wt.topicName,
    accuracy: wt.accuracy,
    recommendation: wt.recommendation,
  }));

  return {
    success: true,
    totalAttempts: attempts.length,
    summary: {
      totalAttempts: attempts.length,
      totalQuestions,
      attemptedCount,
      correctCount,
      incorrectCount,
      skippedCount,
      accuracyPercentage,
      masteryPercentage,
    },
    timeAnalysis: {
      totalTimeSpentSeconds: totalTimeSpent,
      avgTimeCorrectSeconds,
      avgTimeIncorrectSeconds,
      avgTimeSkippedSeconds,
      avgTimePerQuestionSeconds,
    },
    topicMastery,
    weakTopics,
    revisionRecommendations,
  };
};
