import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const knowledgeChunkQueue = new Queue(
  "knowledge-chunk",
  {
    connection: redisConnection,
  }
);

export const scheduleKnowledgeChunking = async (chapterId) => {
  if (!chapterId) {
    throw new Error("Chapter ID is required");
  }

  const jobId = `knowledge-chunk-${chapterId}`;

  const existingJob = await knowledgeChunkQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();

    if (["waiting", "active", "delayed"].includes(state)) {
      return existingJob;
    }

    await existingJob.remove();
  }

  return knowledgeChunkQueue.add(
    "process-knowledge-chunk",
    {
      chapterId,
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

