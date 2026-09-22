import cron from "node-cron";

import {
  TestSubmission,
  SUBMISSION_STATUS,
} from "../models/testSubmission.model.js";

import { LeaderboardSnapshot } from "../models/leaderboardSnapshot.model.js";

import { ExamAttempt } from "../models/examAttempt.model.js";
import { Leaderboard } from "../models/leaderboard.model.js";

const LOOKBACK_DAYS = 30;

let isRunning = false;
let scheduledTask = null;

/**
 * FEATURE 1: Aggregate current leaderboards.
 *
 * - Only tests active within the last 30 days.
 * - Best attempt per user.
 * - Ranking: score DESC, time ASC, submittedAt ASC.
 * - Calculates percentile.
 *
 * @returns {Promise<number>}
 */
export const aggregateLeaderboards = async () => {
  const cutoff = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000
  );

  const activeTestIds = await ExamAttempt.distinct("testId", {
    status: "SUBMITTED",
    submittedAt: { $gte: cutoff },
  });

  let upsertCount = 0;

  for (const testId of activeTestIds) {
    try {
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

      if (!attempts.length) continue;

      // Keep only the best attempt per user.
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
            new Date(attempt.submittedAt) <
              new Date(existing.submittedAt));

        if (isBetter) {
          bestByUser.set(uid, attempt);
        }
      }

      const sorted = Array.from(bestByUser.values()).sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        if (a.totalTimeSeconds !== b.totalTimeSeconds) {
          return a.totalTimeSeconds - b.totalTimeSeconds;
        }

        return new Date(a.submittedAt) - new Date(b.submittedAt);
      });

      const total = sorted.length;

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

      await Leaderboard.findOneAndUpdate(
        { testId },
        {
          $set: {
            rankings,
            lastAggregatedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      upsertCount++;
    } catch (error) {
      console.error(
        `Leaderboard aggregation failed for test ${testId}:`,
        error
      );
    }
  }

  console.log(
    `Leaderboard Cron: Updated ${upsertCount}/${activeTestIds.length} leaderboards.`
  );

  return upsertCount;
};

/**
 * FEATURE 2: Generate hourly leaderboard snapshots.
 *
 * - Finds tests containing submitted submissions.
 * - Ranks submissions by score.
 * - Earlier submission wins ordering ties.
 * - Equal scores receive equal ranks: 1, 2, 2, 4.
 * - Upserts snapshot by testId + snapshotAt.
 *
 * @returns {Promise<number>}
 */
export const aggregateLeaderboardSnapshots = async () => {
  const now = new Date();

  const snapshotAt = new Date(now);
  snapshotAt.setMinutes(0, 0, 0);

  const testIds = await TestSubmission.distinct("testId", {
    status: SUBMISSION_STATUS.SUBMITTED,
  });

  if (!testIds.length) {
    console.log("Leaderboard Snapshot: No submitted tests found.");
    return 0;
  }

  let updatedCount = 0;

  for (const testId of testIds) {
    try {
      const submissions = await TestSubmission.find({
        testId,
        status: SUBMISSION_STATUS.SUBMITTED,
      })
        .sort({
          score: -1,
          submittedAt: 1,
        })
        .select("studentId score submittedAt")
        .lean();

      if (!submissions.length) continue;

      const rankings = [];

      let rank = 1;

      for (let i = 0; i < submissions.length; i++) {
        if (
          i > 0 &&
          submissions[i].score < submissions[i - 1].score
        ) {
          rank = i + 1;
        }

        rankings.push({
          studentId: submissions[i].studentId,
          rank,
          score: submissions[i].score,
        });
      }

      await LeaderboardSnapshot.findOneAndUpdate(
        {
          testId,
          snapshotAt,
        },
        {
          $set: {
            rankings,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      updatedCount++;
    } catch (error) {
      console.error(
        `Leaderboard snapshot failed for test ${testId}:`,
        error
      );
    }
  }

  console.log(
    `Leaderboard Snapshot: Updated ${updatedCount}/${testIds.length} snapshots.`
  );

  return updatedCount;
};

/**
 * Run both leaderboard jobs every hour.
 *
 * Prevents overlapping executions inside this Node.js process.
 * Each aggregation is independently executed.
 */
export const scheduleLeaderboardCron = () => {
  if (scheduledTask) {
    console.warn("Leaderboard Cron is already scheduled.");
    return scheduledTask;
  }

  scheduledTask = cron.schedule("0 * * * *", async () => {
    if (isRunning) {
      console.warn(
        "Leaderboard Cron: Previous execution still running. Skipping."
      );
      return;
    }

    isRunning = true;

    console.log(
      `[${new Date().toISOString()}] Leaderboard Cron started.`
    );

    try {
      const jobs = [
        {
          name: "Current Leaderboard",
          run: aggregateLeaderboards,
        },
        {
          name: "Hourly Snapshot",
          run: aggregateLeaderboardSnapshots,
        },
      ];

      for (const job of jobs) {
        try {
          const count = await job.run();

          console.log(`${job.name}: Updated ${count} test(s).`);
        } catch (error) {
          console.error(`${job.name} failed:`, error);
        }
      }
    } finally {
      isRunning = false;

      console.log(
        `[${new Date().toISOString()}] Leaderboard Cron finished.`
      );
    }
  });

  console.log("Leaderboard Cron scheduled: 0 * * * *");

  return scheduledTask;
};