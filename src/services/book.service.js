import { BookBlock } from "../models/bookBlock.model.js";
import { addTranslationJob } from "./translation.queue.service.js";

export const createBookBlock = async ({
  chapterId,
  blockNumber,
  englishText,
}) => {
  const bookBlock = await BookBlock.create({
    chapterId,
    blockNumber,
    englishText,
  });

  await addTranslationJob(bookBlock._id.toString());

  return bookBlock;
};