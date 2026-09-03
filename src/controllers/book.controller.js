import { createBookBlock } from "../services/book.service.js";

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