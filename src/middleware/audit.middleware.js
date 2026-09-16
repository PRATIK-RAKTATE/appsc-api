import AuditLog from "../models/auditLog.model.js";

const isValidObjectId = (value) => {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
};

const getActorId = (req) => {
  return req.user?.userId || req.user?._id || req.user?.id;
};

const getResourceId = (req) => {
  const idFields = [
    "id",
    "bookId",
    "paymentId",
    "questionId",
    "testId",
    "articleId",
    "jobId",
    "settingId",
    "subjectId",
    "topicId",
    "subTopicId",
  ];

  for (const field of idFields) {
    const value = req.params[field] || req.body?.[field];
    if (isValidObjectId(value)) {
      return value;
    }
  }

  return null;
};

const defaultCaptureChanges = (req, resBody) => {
  const changes = {};
  const data = resBody?.data || resBody;

  if (req.method === "DELETE") {
    changes.deleted = { id: getResourceId(req) };
  } else {
    changes.input = req.body;
    changes.output = data;
  }

  return changes;
};

export const auditLog = ({ resourceType, action, captureChanges } = {}) => {
  return async (req, res, next) => {
    const actorId = getActorId(req);

    if (!actorId || !isValidObjectId(actorId)) {
      return next();
    }

    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode;

    res.status = function (code) {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = function (body) {
      const effectiveStatus = statusCode || res.statusCode || 200;

      if (effectiveStatus >= 200 && effectiveStatus < 300) {
        const logAction = action || `${req.method.toUpperCase()}_${resourceType || "UNKNOWN"}`;
        const logResourceType = resourceType || "UNKNOWN";
        const resourceId = getResourceId(req);

        const changes = captureChanges
          ? captureChanges(req, body)
          : defaultCaptureChanges(req, body);

        AuditLog.create({
          actorId,
          action: logAction,
          resourceType: logResourceType,
          ...(resourceId && { resourceId }),
          changes,
        }).catch((err) => {
          console.error("Failed to create audit log:", err);
        });
      }

      return originalJson(body);
    };

    next();
  };
};
