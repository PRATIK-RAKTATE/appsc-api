import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import {
  Chapter,
  CHAPTER_STATUS,
} from "../models/chapter.model.js";
import { createKnowledgeChunks } from "../services/knowledgeChunk.service.js";

const worker = new Worker(
  "knowledge-chunk",
  async (job) => {
    const { chapterId } = job.data;

    if (!chapterId) {
      throw new Error("Chapter ID is required");
    }

    const chapter = await Chapter.findById(chapterId);

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    try {
      await Chapter.findByIdAndUpdate(chapterId, {
        status: CHAPTER_STATUS.PROCESSING,
      });

      console.log(
        `Knowledge chunk job started: ${job.id} | Chapter: ${chapterId}`
      );

      const chunks = await createKnowledgeChunks(chapterId);

      await Chapter.findByIdAndUpdate(chapterId, {
        status: CHAPTER_STATUS.COMPLETED,
      });

      console.log(
        `Knowledge chunk job completed: ${job.id} | Chapter: ${chapterId} | Chunks: ${chunks.length}`
      );

      return {
        chapterId,
        chunkCount: chunks.length,
      };
    } catch (error) {
      await Chapter.findByIdAndUpdate(chapterId, {
        status: CHAPTER_STATUS.FAILED,
      });

      console.error(
        `Knowledge chunk job failed: ${job.id} | Chapter: ${chapterId}`,
        error
      );

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

worker.on("completed", (job, result) => {
  console.log(`Knowledge chunk worker completed: ${job.id}`, result);
});

worker.on("failed", (job, error) => {
  console.error(
    `Knowledge chunk worker failed: ${job?.id}`,
    error
  );
});

export default worker;

