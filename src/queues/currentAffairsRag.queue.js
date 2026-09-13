import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const currentAffairsRagQueue = new Queue("current-affairs-rag", {
  connection: redisConnection,
});

/**
 * Schedules a BullMQ job to ingest a Current Affairs article into the RAG vector store.
 * @param {string|mongoose.Types.ObjectId} currentAffairsId
 * @returns {Promise<Job>}
 */
export const scheduleCurrentAffairsRagIngestion = async (currentAffairsId) => {
  if (!currentAffairsId) {
    throw new Error("Current affairs ID is required");
  }

  const jobId = `current-affairs-rag-${currentAffairsId}`;

  const existingJob = await currentAffairsRagQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();

    if (["waiting", "active", "delayed"].includes(state)) {
      return existingJob;
    }

    await existingJob.remove();
  }

  return currentAffairsRagQueue.add(
    "process-current-affairs-rag",
    {
      currentAffairsId,
    },
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
