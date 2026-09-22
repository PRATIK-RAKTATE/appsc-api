import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },

    action: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 100,
    },

    resourceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },

    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Useful for filtering audit logs by actor and latest actions
auditLogSchema.index({ actorId: 1, createdAt: -1 });

// Useful for filtering logs for a particular resource
auditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

// Prevent normal document updates/deletes.
// Audit logs should be append-only.
auditLogSchema.pre(
  ["updateOne", "updateMany", "findOneAndUpdate", "deleteOne", "deleteMany", "findOneAndDelete"],
  function () {
    throw new Error("Audit logs are immutable");
  }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;