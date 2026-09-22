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
 * Returns true if the user has at least one currently valid ACTIVE entitlement.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<boolean>}
 */
const isEnrolledUser = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required to check AI quota");
  }

  const now = new Date();
  const active = await UserEntitlement.findOne({
    userId,
    status: ENTITLEMENT_STATUS.ACTIVE,
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
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

  const existing = await DailyAiUsage.findOne({ userId, dateKey });
  if (existing && existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      count: existing.count,
      resetsAt,
    };
  }

  // The count predicate is part of the atomic update. This prevents
  // concurrent requests from consuming more than the daily limit.
  const updated = await DailyAiUsage.findOneAndUpdate(
    { userId, dateKey, count: { $lt: limit } },
    { $inc: { count: 1 } },
    { new: true, returnDocument: "after" }
  );

  if (updated) {
    const count = updated.count;
    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      limit,
      count,
      resetsAt,
    };
  }

  // No row means this is the first query of the day. Creating the initial
  // row is separate because an upsert with `count: { $lt: limit }` can
  // reinsert an exhausted row under concurrent traffic.
  try {
    const created = await DailyAiUsage.create({ userId, dateKey, count: 1 });
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      count: created.count,
      resetsAt,
    };
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    // Another request created the row first; retry the guarded increment.
    const retried = await DailyAiUsage.findOneAndUpdate(
      { userId, dateKey, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { new: true, returnDocument: "after" }
    );

    if (retried) {
      const count = retried.count;
      return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        limit,
        count,
        resetsAt,
      };
    }

    const exhausted = await DailyAiUsage.findOne({ userId, dateKey });
    return {
      allowed: false,
      remaining: 0,
      limit,
      count: exhausted?.count ?? limit,
      resetsAt,
    };
  }
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
