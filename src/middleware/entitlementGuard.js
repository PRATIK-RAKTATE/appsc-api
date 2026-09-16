import { UserEntitlement, ENTITLEMENT_STATUS } from "../models/userEntitlement.model.js";
import { findCourseIdByR2Key } from "../services/video.service.js";
import { Test } from "../models/test.model.js";

export const requireActiveEntitlement = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required", code: "UNAUTHENTICATED" });
    }

    let courseId = req.params.courseId || req.body.courseId || req.query.courseId;

    if (!courseId) {
      if (req.params.testId) {
        const test = await Test.findById(req.params.testId);
        if (test) courseId = test.courseId;
      }

      if (!courseId && (req.query.r2Key || req.params.r2Key)) {
        const r2Key = req.query.r2Key || req.params.r2Key;
        courseId = await findCourseIdByR2Key(r2Key);
      }
    }

    if (!courseId) {
      return res.status(400).json({ message: "Course ID could not be determined for entitlement verification", code: "COURSE_ID_MISSING" });
    }

    const entitlement = await UserEntitlement.findOne({ userId, courseId });

    if (!entitlement) {
      return res.status(403).json({
        message: "You do not own this course",
        code: "NO_ENTITLEMENT"
      });
    }

    const now = new Date();
    if (
      entitlement.status === ENTITLEMENT_STATUS.EXPIRED ||
      (!entitlement.isLifetime && now > entitlement.expiresAt)
    ) {
      return res.status(403).json({
        message: "Course validity has expired. Renew to access content.",
        code: "ENTITLEMENT_EXPIRED"
      });
    }

    if (entitlement.status === ENTITLEMENT_STATUS.REVOKED) {
      return res.status(403).json({
        message: "Your access to this course has been revoked",
        code: "ENTITLEMENT_REVOKED"
      });
    }

    req.entitlement = entitlement;
    next();
  } catch (error) {
    console.error("EntitlementGuard Error:", error);
    res.status(500).json({ message: "Internal server error during entitlement verification", code: "INTERNAL_ERROR" });
  }
};
