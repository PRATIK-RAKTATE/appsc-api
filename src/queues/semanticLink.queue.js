import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const semanticLinkQueue = new Queue("semantic-link", {
  connection: redisConnection,
});

/**
 * Schedule a semantic-link job for the given article.
 * Deduplicates by jobId: if a job is already waiting/active/delayed, the
 * existing job is returned unchanged. Stale completed/failed jobs are removed
 * before re-adding.
 *
 * @param {string} currentAffairsId - ObjectId string of the article to process.
 * @returns {Promise<import("bullmq").Job>}
 */
export const scheduleSemanticLink = async (currentAffairsId) => {
  if (!currentAffairsId) {
    throw new Error("currentAffairsId is required");
  }

  const jobId = `semantic-link-${currentAffairsId}`;

  const existingJob = await semanticLinkQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();

    if (["waiting", "active", "delayed"].includes(state)) {
      return existingJob;
    }

    await existingJob.remove();
  }

  return semanticLinkQueue.add(
    "process-semantic-link",
    { currentAffairsId },
    {
      jobId,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
};
