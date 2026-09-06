import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { saveReadingProgress } from "../services/book.service.js";

const worker = new Worker(
  "reading-progress",
  async (job) => {
    await saveReadingProgress(job.data);
  },
  {
    connection: redisConnection,
  }
);

worker.on("completed", (job) => {
  console.log(`Reading progress saved: ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(
    `Reading progress job failed: ${job?.id}`,
    error
  );
});

export default worker;