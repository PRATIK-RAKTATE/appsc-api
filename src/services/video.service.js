import { Course } from "../models/course.model.js";
import { CourseModule } from "../models/courseModule.model.js";
import { UserEntitlement, ENTITLEMENT_STATUS } from "../models/userEntitlement.model.js";

export const findCourseIdByR2Key = async (r2Key) => {
  const course = await Course.findOne({ "bundledContent.videos.r2Key": r2Key });
  if (course) return course._id.toString();

  const module = await CourseModule.findOne({ "items.videoMetadata.r2Key": r2Key });
  if (module) return module.courseId.toString();

  return null;
};

export const assertVideoAccess = async (user, r2Key, role) => {
  const userId = typeof user === "object" && user !== null ? user.userId || user._id : user;
  const userRole = role || (typeof user === "object" && user !== null ? user.role : null);

  const course = await Course.findOne({ "bundledContent.videos.r2Key": r2Key });
  let courseId = course ? course._id.toString() : null;
  let isFreePreview = false;

  if (!courseId) {
    const module = await CourseModule.findOne({ "items.videoMetadata.r2Key": r2Key });
    if (module) {
      courseId = module.courseId.toString();
      const item = module.items?.find?.((i) => i.videoMetadata?.r2Key === r2Key);
      if (item?.isFreePreview) {
        isFreePreview = true;
      }
    }
  }

  if (!courseId) {
    const error = new Error("Video not found");
    error.statusCode = 404;
    throw error;
  }

  if (userRole === "ADMIN" || userRole === "MENTOR") {
    return;
  }

  if (isFreePreview) {
    return;
  }

  if (!userId) {
    const error = new Error("You do not have access to this video");
    error.statusCode = 404;
    throw error;
  }

  const entitlement = await UserEntitlement.findOne({
    userId,
    courseId,
    status: ENTITLEMENT_STATUS.ACTIVE,
    startsAt: { $lte: new Date() },
    expiresAt: { $gt: new Date() },
  });

  if (!entitlement) {
    const error = new Error("You do not have access to this video");
    error.statusCode = 404;
    throw error;
  }
};
