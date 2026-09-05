import { BookBlock } from "../models/bookBlock.model.js";
import { addTranslationJob } from "./translation.queue.service.js";
import { Chapter } from "../models/chapter.model.js";
import { Book } from "../models/book.model.js";
import { ReadingProgress } from "../models/readingProgress.model.js";

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

export const getBookReader = async (bookId) => {
  const book = await Book.findById(bookId).lean();

  if (!book) {
    throw new Error("Book not found");
  }

  const chapters = await Chapter.find({ bookId })
    .sort({ chapterNumber: 1 })
    .lean();

  const chapterIds = chapters.map((chapter) => chapter._id);

  const blocks = await BookBlock.find({
    chapterId: { $in: chapterIds },
  })
    .sort({chapterId: 1, blockNumber: 1 })
    .lean();

  return {
    book,
    chapters,
    blocks,
  };
};

export const getReadingProgress = async (userId, bookId) => {
  const progress = await ReadingProgress.findOne({
    userId,
    bookId,
  }).lean();

  return progress;
};

export const saveReadingProgress = async ({
  userId,
  bookId,
  chapterId,
  blockNumber,
  scrollPosition,
  language,
  fontSize,
  theme,
}) => {
  const progress = await ReadingProgress.findOneAndUpdate(
    {
      userId,
      bookId,
    },
    {
      $set: {
        chapterId,
        blockNumber,
        scrollPosition,
        language,
        fontSize,
        theme,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  ).lean();

  return progress;
};