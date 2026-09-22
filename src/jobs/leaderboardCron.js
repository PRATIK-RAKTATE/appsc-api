import cron from "node-cron";
import mongoose from "mongoose";
import { ExamAttempt } from "../models/examAttempt.model.js";
import { Leaderboard } from "../models/leaderboard.model.js";

/**
 * Number of days back to look for active/recent submitted attempts.
 * Tests with at least one submission in this window will be aggregated.
 */
const LOOKBACK_DAYS = 30;

/**
 * Aggregate leaderboard rankings for all tests that have submitted attempts
 * within the last LOOKBACK_DAYS days.
 *
 * Algorithm per test:
 *   1. Gather all SUBMITTED attempts, keeping only the best attempt per user
 *      (highest score → lowest totalTimeSeconds → earliest submittedAt).
 *   2. Sort globally: score DESC → totalTimeSeconds ASC → submittedAt ASC.
 *   3. Assign rank = position + 1.
 *   4. Compute percentile = ((total - rank) / total) * 100, rounded to 2 d.p.
 *   5. Upsert the Leaderboard document for each testId.
 *
 * This function is exported for manual invocation and unit testing.
 *
 * @returns {Promise<number>} Number of leaderboards upserted.
 */
export const aggregateLeaderboards = async () => {
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // Find all distinct testIds with recent submitted attempts
  const activeTestIds = await ExamAttempt.distinct("testId", {
    status: "SUBMITTED",
    submittedAt: { $gte: cutoff },
  });

  if (!activeTestIds.length) {
    console.log(
      `[${new Date().toISOString()}] Leaderboard Cron: No active tests found. Skipping.`
    );
    return 0;
  }

  let upsertCount = 0;

  for (const testId of activeTestIds) {
    try {
      await _aggregateForTest(testId);
      upsertCount++;
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] Leaderboard Cron: Failed for testId ${testId}:`,
        err.message
      );
    }
  }

  console.log(
    `[${new Date().toISOString()}] Leaderboard Cron: Aggregated ${upsertCount}/${activeTestIds.length} leaderboards.`
  );

  return upsertCount;
};

/**
 * Aggregate and upsert the leaderboard for a single test.
 *
 * @param {mongoose.Types.ObjectId|string} testId
 */
const _aggregateForTest = async (testId) => {
  // Fetch all submitted attempts for this test
  const attempts = await ExamAttempt.find(
    { testId, status: "SUBMITTED" },
    {
      userId: 1,
      score: 1,
      totalTimeSeconds: 1,
      accuracy: 1,
      submittedAt: 1,
    }
  ).lean();

  if (!attempts.length) return;

  // Step 1: Deduplicate — keep best attempt per user
  // Tie-break: score DESC → totalTimeSeconds ASC → submittedAt ASC
  const bestByUser = new Map();

  for (const attempt of attempts) {
    const uid = attempt.userId.toString();
    const existing = bestByUser.get(uid);

    if (!existing) {
      bestByUser.set(uid, attempt);
      continue;
    }

    const isBetter =
      attempt.score > existing.score ||
      (attempt.score === existing.score &&
        attempt.totalTimeSeconds < existing.totalTimeSeconds) ||
      (attempt.score === existing.score &&
        attempt.totalTimeSeconds === existing.totalTimeSeconds &&
        new Date(attempt.submittedAt) < new Date(existing.submittedAt));

    if (isBetter) {
      bestByUser.set(uid, attempt);
    }
  }

  // Step 2: Sort global ranking
  const sorted = Array.from(bestByUser.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.totalTimeSeconds !== b.totalTimeSeconds)
      return a.totalTimeSeconds - b.totalTimeSeconds;
    return new Date(a.submittedAt) - new Date(b.submittedAt);
  });

  const total = sorted.length;

  // Step 3 & 4: Assign rank and percentile
  const rankings = sorted.map((attempt, index) => {
    const rank = index + 1;
    const percentile =
      total > 1
        ? Math.round(((total - rank) / total) * 10000) / 100
        : 0;

    return {
      rank,
      userId: attempt.userId,
      attemptId: attempt._id,
      score: attempt.score,
      totalTimeSeconds: attempt.totalTimeSeconds ?? 0,
      accuracy: attempt.accuracy ?? 0,
      percentile,
    };
  });

  // Step 5: Upsert
  await Leaderboard.findOneAndUpdate(
    { testId },
    {
      $set: {
        rankings,
        lastAggregatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
};

/**
 * Schedule the leaderboard aggregation cron to run at the top of every hour.
 */
export const scheduleLeaderboardCron = () => {
  cron.schedule("0 * * * *", async () => {
    console.log(
      `[${new Date().toISOString()}] Leaderboard Cron: Starting hourly aggregation...`
    );
    await aggregateLeaderboards();
  });

  console.log("Leaderboard Cron scheduled: 0 * * * * (hourly)");
};
