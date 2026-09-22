import mongoose from "mongoose";
import { Leaderboard } from "../models/leaderboard.model.js";

/**
 * Fetch the latest leaderboard for a test with pagination.
 * Also returns the requesting user's own rank entry if they appear in the leaderboard.
 *
 * @param {string} testId
 * @param {object} options
 * @param {string|null} [options.userId]  - Authenticated user's ID (for self-rank lookup).
 * @param {number}      [options.page=1]
 * @param {number}      [options.limit=50]
 * @returns {Promise<{
 *   testId: string,
 *   lastAggregatedAt: Date|null,
 *   total: number,
 *   page: number,
 *   limit: number,
 *   rankings: Array,
 *   myRank: object|null,
 * }>}
 */
export const getLeaderboard = async (testId, { userId = null, page = 1, limit = 50 } = {}) => {
  if (!testId || !mongoose.Types.ObjectId.isValid(testId)) {
    throw new Error("Invalid testId");
  }

  const leaderboard = await Leaderboard.findOne({ testId }).lean();

  // Handle zero-attempts edge case
  if (!leaderboard || !leaderboard.rankings.length) {
    return {
      testId,
      lastAggregatedAt: leaderboard?.lastAggregatedAt ?? null,
      total: 0,
      page,
      limit,
      rankings: [],
      myRank: null,
    };
  }

  const allRankings = leaderboard.rankings;
  const total = allRankings.length;

  // Paginate
  const offset = (page - 1) * limit;
  const paginatedRankings = allRankings.slice(offset, offset + limit);

  // Find the requesting user's own entry
  let myRank = null;
  if (userId) {
    const entry = allRankings.find(
      (r) => r.userId.toString() === userId.toString()
    );
    if (entry) {
      myRank = { ...entry };
    }
  }

  return {
    testId,
    lastAggregatedAt: leaderboard.lastAggregatedAt,
    total,
    page,
    limit,
    rankings: paginatedRankings,
    myRank,
  };
};
