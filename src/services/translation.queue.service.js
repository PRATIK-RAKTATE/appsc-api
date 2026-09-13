import { translationQueue } from "../queues/translation.queue.js";

export const addTranslationJob = async (bookBlockId) => {
  const job = await translationQueue.add(
    "translate-book-block",
    {
      bookBlockId,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: true,
    }
  );

  return job;
};  