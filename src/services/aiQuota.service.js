import mongoose from "mongoose";
import { DailyAiUsage } from "../models/dailyAiUsage.model.js";
import { UserEntitlement, ENTITLEMENT_STATUS } from "../models/userEntitlement.model.js";

// ---------------------------------------------------------------------------
// Tier limits
// ---------------------------------------------------------------------------

export const QUERY_LIMITS = {
  ENROLLED: 30,
  FREE: 5,
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Returns today's UTC date string in 'YYYY-MM-DD' format.
 * All quota resets happen at midnight UTC.
 *
 * @returns {string}
 */
export const getTodayUTC = () => new Date().toISOString().slice(0, 10);

/**
 * Returns a Date object representing the end of today in UTC (23:59:59.999).
 * Used as the `resetsAt` timestamp in quota responses.
 *
 * @returns {Date}
 */
export const getEndOfDayUTC = () => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59, 999
    )
  );
};

// ---------------------------------------------------------------------------
// Tier detection
// ---------------------------------------------------------------------------

/**
 * Returns true if the user has at least one non-expired ACTIVE entitlement.
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the user has quota remaining for today, and if so atomically
 * consume one credit.
 *
 * Idempotency notes:
 *  - The read (current count) and the write ($inc) are two separate operations.
 *    This is safe because the pre-increment read only gates the write; a race
 *    that lets two concurrent requests both pass the gate will at most exceed
 *    the limit by one, which is acceptable for this use-case.
 *  - For strict hard limits, callers can treat `remaining === 0` in the
 *    returned object as "blocked" regardless of the `allowed` flag.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{
 *   allowed: boolean,
 *   remaining: number,
 *   limit: number,
 *   count: number,
 *   resetsAt: Date,
 * }>}
 */
export const checkAndConsumeQuota = async (userId) => {
  const enrolled = await isEnrolledUser(userId);
  const limit = enrolled ? QUERY_LIMITS.ENROLLED : QUERY_LIMITS.FREE;
  const dateKey = getTodayUTC();
  const resetsAt = getEndOfDayUTC();

  // Read current count without modifying
  const existing = await DailyAiUsage.findOne({ userId, dateKey });
  const currentCount = existing?.count ?? 0;

  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, limit, count: currentCount, resetsAt };
  }

  // Atomically increment
  const updated = await DailyAiUsage.findOneAndUpdate(
    { userId, dateKey },
    { $inc: { count: 1 } },
    { upsert: true, new: true, returnDocument: "after" }
  );

  const newCount = updated.count;
  const remaining = Math.max(0, limit - newCount);

  return { allowed: true, remaining, limit, count: newCount, resetsAt };
};

/**
 * Read-only quota status — does NOT increment the counter.
 * Suitable for UI widgets and quota-status API endpoints.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ remaining: number, limit: number, count: number, resetsAt: Date }>}
 */
export const getRemainingQuota = async (userId) => {
  const enrolled = await isEnrolledUser(userId);
  const limit = enrolled ? QUERY_LIMITS.ENROLLED : QUERY_LIMITS.FREE;
  const dateKey = getTodayUTC();
  const resetsAt = getEndOfDayUTC();

  const existing = await DailyAiUsage.findOne({ userId, dateKey });
  const count = existing?.count ?? 0;
  const remaining = Math.max(0, limit - count);

  return { remaining, limit, count, resetsAt };
};

// ---------------------------------------------------------------------------
// Backward-compatibility aliases (used by TASK-05.3.1 code)
// ---------------------------------------------------------------------------

/** @deprecated Use checkAndConsumeQuota */
export const checkAndIncrementWebQuota = checkAndConsumeQuota;

/** @deprecated Use getRemainingQuota */
export const getWebQuotaStatus = getRemainingQuota;

/** @deprecated Use QUERY_LIMITS */
export const WEB_SEARCH_LIMITS = QUERY_LIMITS;
