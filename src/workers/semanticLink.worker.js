import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { linkCurrentAffairsToChapters } from "../services/semanticLink.service.js";

const worker = new Worker(
  "semantic-link",
  async (job) => {
    const { currentAffairsId } = job.data;

    if (!currentAffairsId) {
      throw new Error("currentAffairsId is required");
    }

    console.log(
      `Semantic link job started: ${job.id} | Article: ${currentAffairsId}`
    );

    const relatedChapters = await linkCurrentAffairsToChapters(currentAffairsId);

    console.log(
      `Semantic link job completed: ${job.id} | Article: ${currentAffairsId} | Chapters: ${relatedChapters.length}`
    );

    return {
      currentAffairsId,
      chapterCount: relatedChapters.length,
    };
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

worker.on("completed", (job, result) => {
  console.log(`Semantic link worker completed: ${job.id}`, result);
});

worker.on("failed", (job, error) => {
  console.error(`Semantic link worker failed: ${job?.id}`, error);
});

export default worker;
