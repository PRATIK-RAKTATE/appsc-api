// src/workers/translation.worker.js
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { BookBlock, TRANSLATION_STATUS } from "../models/bookBlock.model.js";
import { translateText } from "../services/googleTranslate.service.js";

const worker = new Worker(
  "translation",
  async (job) => {
    const { bookBlockId } = job.data;

    if (!bookBlockId) {
      throw new Error("Book Block ID is required");
    }

    const block = await BookBlock.findById(bookBlockId);
    if (!block) {
      throw new Error("Book block not found");
    }

    try {
      console.log(`Translation job started: ${job.id} | Block: ${bookBlockId}`);

      const translatedText = await translateText(block.contentEn, "te");

      await BookBlock.findByIdAndUpdate(bookBlockId, {
        contentTe: translatedText,
        translationStatus: TRANSLATION_STATUS.TRANSLATED,
      });

      console.log(
        `Translation job completed: ${job.id} | Block: ${bookBlockId}`,
      );

      return { bookBlockId, translated: true };
    } catch (error) {
      await BookBlock.findByIdAndUpdate(bookBlockId, {
        translationStatus: TRANSLATION_STATUS.FAILED,
      });

      console.error(
        `Translation job failed: ${job.id} | Block: ${bookBlockId}`,
        error,
      );
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  },
);

worker.on("completed", (job, result) => {
  console.log(`Translation worker completed: ${job.id}`, result);
});

worker.on("failed", (job, error) => {
  console.error(`Translation worker failed: ${job?.id}`, error);
});

export default worker;
