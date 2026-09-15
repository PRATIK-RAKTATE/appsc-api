import { Course } from "../models/course.model.js";
import { UserEntitlement } from "../models/userEntitlement.model.js";

/**
 * Activates or extends course entitlement for a user.
 * 
 * @param {string|ObjectId} userId 
 * @param {string|ObjectId} courseId 
 * @param {string|ObjectId} [orderId] 
 * @returns {Promise<UserEntitlement>}
 */
export const activateCourseEntitlement = async (userId, courseId, orderId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error("Course not found");
  }

  const validityInDays = course.validityInDays;
  const now = new Date();

  // Find existing entitlement
  const existingEntitlement = await UserEntitlement.findOne({ userId, courseId });

  if (existingEntitlement) {
    let newExpiresAt;
    
    if (existingEntitlement.isLifetime) {
      // Lifetime entitlement doesn't need expiration extension
      return existingEntitlement;
    }

    // If current entitlement is still active, extend from the current expiry date.
    // Otherwise, start from now.
    const currentExpiry = existingEntitlement.expiresAt;
    const baseDate = (currentExpiry && currentExpiry > now) ? currentExpiry : now;
    
    newExpiresAt = new Date(baseDate.getTime() + validityInDays * 24 * 60 * 60 * 1000);

    return await UserEntitlement.findOneAndUpdate(
      { userId, courseId },
      {
        $set: {
          expiresAt: newExpiresAt,
          status: "ACTIVE",
          orderId: orderId || existingEntitlement.orderId,
        },
      },
      { new: true }
    );
  }

  // Create new entitlement
  const expiresAt = new Date(now.getTime() + validityInDays * 24 * 60 * 60 * 1000);
  
  return await UserEntitlement.create({
    userId,
    courseId,
    orderId,
    startsAt: now,
    expiresAt,
    status: "ACTIVE",
  });
};
