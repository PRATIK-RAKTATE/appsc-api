import mongoose from "mongoose";
import { CurrentAffairsBookmark } from "../models/currentAffairsBookmark.model.js";

/**
 * Toggles a bookmark for a current affairs article.
 * Adds a bookmark if it does not exist; removes it if it already exists.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|mongoose.Types.ObjectId} currentAffairsId
 * @returns {Promise<Object>} { bookmarked: boolean, bookmark: Document|null }
 */
export const toggleBookmark = async (userId, currentAffairsId) => {
  if (!userId || !currentAffairsId) {
    throw new Error("userId and currentAffairsId are required");
  }

  const existing = await CurrentAffairsBookmark.findOne({
    user: userId,
    currentAffairs: currentAffairsId,
  });

  if (existing) {
    await CurrentAffairsBookmark.findByIdAndDelete(existing._id);
    return { bookmarked: false, bookmark: null };
  }

  try {
    const bookmark = await CurrentAffairsBookmark.create({
      user: userId,
      currentAffairs: currentAffairsId,
    });

    return { bookmarked: true, bookmark };
  } catch (error) {
    if (error.code === 11000) {
      const bookmark = await CurrentAffairsBookmark.findOne({
        user: userId,
        currentAffairs: currentAffairsId,
      });

      return { bookmarked: true, bookmark };
    }

    throw error;
  }
};

/**
 * Checks whether a current affairs article is bookmarked by a user.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {string|mongoose.Types.ObjectId} currentAffairsId
 * @returns {Promise<boolean>}
 */
export const isBookmarked = async (userId, currentAffairsId) => {
  if (!userId || !currentAffairsId) {
    return false;
  }

  const bookmark = await CurrentAffairsBookmark.findOne({
    user: userId,
    currentAffairs: currentAffairsId,
  });

  return Boolean(bookmark);
};

/**
 * Fetches all bookmarked current affairs articles for a user with pagination.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Object} [pagination]
 * @param {number} [pagination.page=1]
 * @param {number} [pagination.limit=10]
 * @returns {Promise<Object>}
 */
export const getUserBookmarks = async (
  userId,
  { page = 1, limit = 10 } = {}
) => {
  if (!userId) {
    throw new Error("userId is required");
  }

  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

  const [items, total] = await Promise.all([
    CurrentAffairsBookmark.find({ user: userId })
      .populate("currentAffairs")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CurrentAffairsBookmark.countDocuments({ user: userId }),
  ]);

  return {
    data: items,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit) || 1,
  };
};
