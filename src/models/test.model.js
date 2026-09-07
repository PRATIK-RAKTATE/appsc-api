import mongoose, { Schema, model } from "mongoose";

export const TEST_TYPES = {
  MOCK_TEST: "MOCK_TEST",
  SECTIONAL_TEST: "SECTIONAL_TEST",
  QUIZ: "QUIZ",
};

export const SCHEDULE_MODES = {
  ON_DEMAND: "ON_DEMAND",
  SCHEDULED: "SCHEDULED",
};

const negativeMarkingSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    coefficient: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const randomizationSchema = new Schema(
  {
    questions: {
      type: Boolean,
      default: false,
    },

    options: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const scheduleSchema = new Schema(
  {
    mode: {
      type: String,
      enum: Object.values(SCHEDULE_MODES),
      required: true,
      default: SCHEDULE_MODES.ON_DEMAND,
    },

    startAt: {
      type: Date,
    },

    endAt: {
      type: Date,
    },
  },
  { _id: false }
);

const testSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      enum: Object.values(TEST_TYPES),
      required: true,
      index: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    negativeMarking: {
      type: negativeMarkingSchema,
      default: () => ({
        enabled: false,
        coefficient: 0,
      }),
    },

    randomization: {
      type: randomizationSchema,
      default: () => ({
        questions: false,
        options: false,
      }),
    },

    schedule: {
      type: scheduleSchema,
      required: true,
      default: () => ({
        mode: SCHEDULE_MODES.ON_DEMAND,
      }),
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Scheduled tests must have start and end time.
testSchema.pre("validate", function () {
  if (this.schedule?.mode === SCHEDULE_MODES.SCHEDULED) {
    if (!this.schedule.startAt || !this.schedule.endAt) {
      this.invalidate(
        "schedule",
        "Scheduled tests require startAt and endAt"
      );
    } else if (this.schedule.startAt >= this.schedule.endAt) {
      this.invalidate(
        "schedule.endAt",
        "endAt must be later than startAt"
      );
    }
  }

  // Negative coefficient is required when negative marking is enabled.
  if (
    this.negativeMarking?.enabled &&
    this.negativeMarking.coefficient <= 0
  ) {
    this.invalidate(
      "negativeMarking.coefficient",
      "Coefficient must be greater than 0 when negative marking is enabled"
    );
  }
});

testSchema.index({ type: 1, createdAt: -1 });
testSchema.index({ "schedule.mode": 1, "schedule.startAt": 1 });

export const Test = model("Test", testSchema);