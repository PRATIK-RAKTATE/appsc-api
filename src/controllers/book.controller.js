import {createBookBlock,getBookReader,getReadingProgress,} from "../services/book.service.js";
import { scheduleReadingProgress } from "../services/readingProgress.queue.service.js";


export const createBookBlockController = async (req, res) => {
  try {
    const { chapterId, blockNumber, englishText } = req.body;

    if (!chapterId || !blockNumber || !englishText) {
      return res.status(400).json({
        success: false,
        message: "chapterId, blockNumber and englishText are required",
      });
    }

    const bookBlock = await createBookBlock({
      chapterId,
      blockNumber,
      englishText,
    });

    return res.status(201).json({
      success: true,
      message: "BookBlock created and translation job added",
      data: bookBlock,
    });
  } catch (error) {
    console.error("Create BookBlock error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create BookBlock",
      error: error.message,
    });
  }
};

export const getBookReaderController = async (req, res) => {
  try {
    const { bookId } = req.params;

    const data = await getBookReader(bookId);

    return res.status(200).json({
      success: true,
      message: "Book reader data fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get book reader error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReadingProgressController = async (req, res) => {
  try {
    const { bookId } = req.params;

    const progress = await getReadingProgress(req.user.userId, bookId);

    return res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Get reading progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch reading progress",
    });
  }
};

export const saveReadingProgressController = async (req, res) => {
  try {
    const { bookId } = req.params;

    const {
      chapterId,
      blockNumber,
      scrollPosition,
      language,
      fontSize,
      theme,
    } = req.body;

    if (
      !chapterId ||
      !blockNumber ||
      scrollPosition === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "chapterId, blockNumber and scrollPosition are required",
      });
    }

    await scheduleReadingProgress({
      userId: req.user.userId,
      bookId,
      chapterId,
      blockNumber,
      scrollPosition,
      language,
      fontSize,
      theme,
    });

    return res.status(202).json({
      success: true,
      message: "Reading progress update scheduled",
    });
  } catch (error) {
    console.error("Schedule reading progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to schedule reading progress",
    });
  }
};