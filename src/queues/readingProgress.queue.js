import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const readingProgressQueue = new Queue(
  "reading-progress",
  {
    connection: redisConnection,
  }
);

export const scheduleReadingProgress = async ({
  userId,
  bookId,
  chapterId,
  blockNumber,
  scrollPosition,
  language,
  fontSize,
  theme,
}) => {
  const jobId = `progress-${userId}-${bookId}`;

  const existingJob = await readingProgressQueue.getJob(jobId);

  if (existingJob) {
    await existingJob.remove();
  }

  await readingProgressQueue.add(
    "save-reading-progress",
    {
      userId,
      bookId,
      chapterId,
      blockNumber,
      scrollPosition,
      language,
      fontSize,
      theme,
    },
    {
      jobId,
      delay: 1000,
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
};