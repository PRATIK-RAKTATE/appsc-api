import mongoose from "mongoose";
import { DailyAiUsage } from "../models/dailyAiUsage.model.js";
import { UserEntitlement, ENTITLEMENT_STATUS } from "../models/userEntitlement.model.js";

/**
 * Tiered daily web-search limits.
 * Enrolled student = user with at least one ACTIVE entitlement.
 * Free-tier student = no active entitlement.
 */
export const WEB_SEARCH_LIMITS = {
  ENROLLED: 30,
  FREE: 5,
};

/**
 * Returns the current UTC date string in 'YYYY-MM-DD' format.
 * All quota resets happen at midnight UTC — consistent regardless of server timezone.
 *
 * @returns {string}
 */
export const getTodayUTC = () => new Date().toISOString().slice(0, 10);

/**
 * Determines whether the user has an active course entitlement.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<boolean>}
 */
const isEnrolledUser = async (userId) => {
  const active = await UserEntitlement.findOne({
    userId,
    status: ENTITLEMENT_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() },
  });
  return Boolean(active);
};

/**
 * Check whether the user is within their daily web-search quota.
 * If allowed, atomically increments the counter and returns the updated state.
 *
 * Uses `findOneAndUpdate` with `upsert: true` for a race-condition-safe
 * atomic read-modify-write.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ allowed: boolean, remaining: number, limit: number, count: number }>}
 */
export const checkAndIncrementWebQuota = async (userId) => {
  const enrolled = await isEnrolledUser(userId);
  const limit = enrolled ? WEB_SEARCH_LIMITS.ENROLLED : WEB_SEARCH_LIMITS.FREE;
  const today = getTodayUTC();

  // First, read the current count without modifying it
  const existing = await DailyAiUsage.findOne({ userId, date: today });
  const currentCount = existing?.webSearchCount ?? 0;

  if (currentCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      count: currentCount,
    };
  }

  // Atomically increment
  const updated = await DailyAiUsage.findOneAndUpdate(
    { userId, date: today },
    { $inc: { webSearchCount: 1 } },
    { upsert: true, new: true, returnDocument: "after" }
  );

  const newCount = updated.webSearchCount;
  const remaining = Math.max(0, limit - newCount);

  return {
    allowed: true,
    remaining,
    limit,
    count: newCount,
  };
};

/**
 * Read-only quota status for the current day without modifying the counter.
 * Useful for informational responses.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ remaining: number, limit: number, count: number }>}
 */
export const getWebQuotaStatus = async (userId) => {
  const enrolled = await isEnrolledUser(userId);
  const limit = enrolled ? WEB_SEARCH_LIMITS.ENROLLED : WEB_SEARCH_LIMITS.FREE;
  const today = getTodayUTC();

  const existing = await DailyAiUsage.findOne({ userId, date: today });
  const count = existing?.webSearchCount ?? 0;
  const remaining = Math.max(0, limit - count);

  return { remaining, limit, count };
};
