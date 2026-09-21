import cron from "node-cron";
import mongoose from "mongoose";
import { TestSubmission, SUBMISSION_STATUS } from "../models/testSubmission.model.js";
import { LeaderboardSnapshot } from "../models/leaderboardSnapshot.model.js";

/**
 * Aggregates TestSubmission documents for every test that has been submitted,
 * ranks students by score (tiebreaker: earlier submission wins), then upserts
 * a LeaderboardSnapshot keyed to the top of the current hour.
 *
 * Standard ranking is used: students with the same score share the same rank,
 * and the next rank is skipped (e.g. 1, 2, 2, 4).
 */
export const aggregateLeaderboards = async () => {
  try {
    const now = new Date();
    // Snap to the top of the current hour — this is the upsert key
    const snapshotAt = new Date(now);
    snapshotAt.setMinutes(0, 0, 0);

    // Find all distinct testIds that have at least one submitted submission
    const testIds = await TestSubmission.distinct("testId", {
      status: SUBMISSION_STATUS.SUBMITTED,
    });

    if (!testIds.length) {
      console.log(`[${now.toISOString()}] Leaderboard Cron: No submitted tests found.`);
      return 0;
    }

    let updatedCount = 0;

    for (const testId of testIds) {
      // Fetch all submitted submissions for this test, ordered by score desc then submittedAt asc
      const submissions = await TestSubmission.find({
        testId,
        status: SUBMISSION_STATUS.SUBMITTED,
      })
        .sort({ score: -1, submittedAt: 1 })
        .select("studentId score submittedAt");

      if (!submissions.length) continue;

      // Assign standard ranks (1, 2, 2, 4, ...)
      const rankings = [];
      let rank = 1;
      for (let i = 0; i < submissions.length; i++) {
        if (i > 0 && submissions[i].score < submissions[i - 1].score) {
          rank = i + 1;
        }
        rankings.push({
          studentId: submissions[i].studentId,
          rank,
          score: submissions[i].score,
        });
      }

      // Upsert the snapshot (unique on testId + snapshotAt)
      await LeaderboardSnapshot.findOneAndUpdate(
        { testId, snapshotAt },
        { $set: { rankings } },
        { upsert: true, new: true }
      );

      updatedCount++;
    }

    console.log(
      `[${now.toISOString()}] Leaderboard Cron: Updated snapshots for ${updatedCount} test(s).`
    );
    return updatedCount;
  } catch (error) {
    console.error("Leaderboard Cron Error:", error);
    throw error;
  }
};

/**
 * Schedules the leaderboard aggregation to run once every hour (at minute 0).
 */
const scheduleLeaderboardCron = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("Running hourly leaderboard aggregation job...");
    await aggregateLeaderboards();
  });
  console.log("Leaderboard Cron scheduled: 0 * * * *");
};

export { scheduleLeaderboardCron };
