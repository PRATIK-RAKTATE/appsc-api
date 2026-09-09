import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { ingestCurrentAffairsRAG } from "../services/currentAffairsRag.service.js";

const worker = new Worker(
  "current-affairs-rag",
  async (job) => {
    const { currentAffairsId } = job.data;

    if (!currentAffairsId) {
      throw new Error("Current affairs ID is required");
    }

    console.log(
      `Current affairs RAG job started: ${job.id} | Article: ${currentAffairsId}`
    );

    const chunks = await ingestCurrentAffairsRAG(currentAffairsId);

    console.log(
      `Current affairs RAG job completed: ${job.id} | Article: ${currentAffairsId} | Chunks: ${chunks.length}`
    );

    return {
      currentAffairsId,
      chunkCount: chunks.length,
    };
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

worker.on("completed", (job, result) => {
  console.log(`Current affairs RAG worker completed: ${job.id}`, result);
});

worker.on("failed", (job, error) => {
  console.error(`Current affairs RAG worker failed: ${job?.id}`, error);
});

export default worker;
